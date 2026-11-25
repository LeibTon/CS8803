// App entry: welcome → tutorial → tasks (config.js STEPS) → done.

import { CONFIG, STEPS } from './config.js';
import { loadSession, createSession, saveSession, newParticipantId, pickVariant } from './session.js';
import { queueRecord, flush, pendingCount, archivedRecords, downloadJSON } from './logger.js';
import { SCENARIOS } from './data/scenarios.js';
import { ASSESSMENTS } from './data/assessments.js';
import { renderWelcome, renderTutorial, renderDone } from './ui/screens.js';
import { renderProgress } from './ui/progress.js';
import { mountTask } from './ui/task.js';

const ALL = { ...SCENARIOS, ...ASSESSMENTS };
const app = document.getElementById('app');
const progressEl = document.getElementById('progress');
const chip = document.getElementById('mode-chip');
document.getElementById('brand-title').textContent = CONFIG.STUDY_TITLE;
document.title = CONFIG.STUDY_TITLE;

const boot = loadSession();
let session = boot.session;
let current = null;

const steps = STEPS.filter((s) => !s.pretest || CONFIG.ENABLE_PRETEST);
const taskSteps = steps.filter((s) => s.kind === 'task');
const save = () => saveSession(session);

function feedbackFor(step) {
  if (step.feedback === 'always') return true;
  if (step.feedback === 'none') return false;
  return !!CONFIG.CONDITIONS[session.condition]?.feedback;
}

/**
 * A step's scenario may be one id or a list of ids to counterbalance across participants.
 * Steps with the same `counterbalance` key share one index (used to pair pre-test and transfer forms).
 */
function scenarioFor(step) {
  const saved = session.steps[step.id]?.scenarioId;
  if (saved) return ALL[saved];
  const ids = [].concat(step.scenario);
  const id = ids[pickVariant(session.pid, step.counterbalance || step.id, ids.length)];
  if (!ALL[id]) throw new Error(`Unknown scenario "${id}" in STEPS`);
  return ALL[id];
}

function setChip(text, kind) {
  chip.hidden = !text;
  chip.textContent = text || '';
  chip.className = `mode-chip ${kind || ''}`;
}

function render() {
  current?.destroy?.();
  current = null;
  window.scrollTo(0, 0);

  if (!session) {
    progressEl.replaceChildren();
    setChip(null);
    renderWelcome(app, {
      onStart: () => {
        session = createSession(boot.urlPid || newParticipantId(), boot.urlCond);
        save();
        render();
      },
    });
    return;
  }

  const step = steps[Math.min(session.stepIndex, steps.length - 1)];
  const doneIds = new Set(steps.slice(0, session.stepIndex).map((s) => s.id));
  renderProgress(progressEl, taskSteps, doneIds, step.id);

  if (step.kind === 'tutorial') {
    setChip('Introduction');
    current = renderTutorial(app, { scenario: SCENARIOS['tutorial-garden'], onContinue: advance });
    return;
  }

  if (step.kind === 'done') {
    setChip(null);
    if (!session.completedAt) { session.completedAt = new Date().toISOString(); save(); }
    const returnUrl = CONFIG.RETURN_URL
      ? `${CONFIG.RETURN_URL}${CONFIG.RETURN_URL.includes('?') ? '&' : '?'}pid=${encodeURIComponent(session.pid)}`
      : '';
    const shown = pendingCount();
    renderDone(app, {
      pid: session.pid,
      pending: shown,
      endpointSet: !!CONFIG.ENDPOINT,
      returnUrl,
      onRetry: async () => { await flush(); render(); },
      onDownload: () => downloadJSON(`${session.pid}-${session.sessionId}.json`, { session, records: archivedRecords(session.sessionId) }),
    });
    // Refresh once if the upload status changed while the page was rendering.
    flush().then(() => { if (pendingCount() < shown && steps[session.stepIndex]?.kind === 'done') render(); });
    return;
  }

  const feedbackOn = feedbackFor(step);
  setChip(feedbackOn ? `${step.label} · feedback on` : step.reflection ? 'Assessment · no feedback' : `${step.label} · no feedback`, feedbackOn ? 'on' : 'off');
  current = mountTask(app, {
    step,
    scenario: scenarioFor(step),
    session,
    feedbackOn,
    index: taskSteps.indexOf(step) + 1,
    total: taskSteps.length,
    save,
    onComplete: (record) => {
      queueRecord(record);
      advance();
    },
  });
}

function advance() {
  session.stepIndex += 1;
  save();
  render();
}

// Retry uploads in the background.
flush();
setInterval(flush, 30_000);
window.addEventListener('online', flush);

render();
