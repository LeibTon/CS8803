// One scenario screen: scenario text | palette + canvas | feedback. Wires the graph model to the
// UI, logs every edit, and builds the record that is submitted when the learner moves on.

import { CONFIG } from '../config.js';
import { GraphModel } from '../graph.js';
import { parseMarkup, matchSpan, tidyLabel } from '../markup.js';
import { scoreGraph, buildHints, summarize } from '../scoring.js';
import { computeParams } from '../scenarioParams.js';
import { h } from './dom.js';
import { createScenarioPanel } from './scenarioPanel.js';
import { createPalette } from './palette.js';
import { createCanvas } from './canvas.js';
import { createFeedbackPanel } from './feedbackPanel.js';

const MAX_EVENTS = 3000;

export function mountTask(root, { step, scenario, session, feedbackOn, index, total, save, onComplete }) {
  const { plain, spans } = parseMarkup(scenario.markup ?? scenario.text);
  const scorable = Array.isArray(scenario.relations);
  const state = (session.steps[step.id] ||= { scenarioId: scenario.id, startedAt: Date.now(), checks: 0, events: [], graph: null });
  const model = GraphModel.fromJSON(state.graph);
  const log = (type, data = {}) => {
    if (state.events.length < MAX_EVENTS) state.events.push({ t: Date.now() - state.startedAt, type, ...data });
  };
  log(state.events.length ? 'resume' : 'start');

  // ---------- layout ----------
  const left = h('section.panel.scenario-panel');
  const paletteHost = h('div.palette');
  const canvasHost = h('div.canvas-wrap');
  const footerText = h('span.footer-text');
  const footerCount = h('span.footer-count');
  const deleteBtn = h('button.link-btn', { type: 'button', hidden: true, onClick: () => canvas.deleteSelection() }, 'Delete');
  const center = h('section.panel.workspace', {}, paletteHost, canvasHost, h('div.canvas-footer', {}, footerText, deleteBtn, footerCount));
  const right = h('aside.panel.feedback-panel');
  root.className = 'app task-layout';
  root.replaceChildren(left, center, right);

  // ---------- components ----------
  const panel = createScenarioPanel(left, {
    eyebrow: `Scenario ${index} of ${total} · ${scenario.difficulty}`,
    title: scenario.title,
    plain,
    onAddNode: addNodeFromText,
  });

  const palette = createPalette(paletteHost, {
    onPick: (type) => {
      const sel = canvas.selection();
      if (sel?.kind === 'edge') model.setEdgeType(sel.uid, type);
      else palette.nudge();
    },
  });

  const canvas = createCanvas(canvasHost, model, {
    onSelect: (sel) => {
      palette.setActive(sel?.kind === 'edge' ? model.edge(sel.uid)?.type : null);
      updateFooter(sel);
    },
  });

  const feedback = createFeedbackPanel(right, {
    live: feedbackOn,
    reflection: !!step.reflection,
    requireCheck: feedbackOn && CONFIG.REQUIRE_CHECK_BEFORE_NEXT,
    checks: state.checks,
    onCheck: check,
    onNext: finish,
  });

  // ---------- behaviour ----------
  let flagged = { nodes: new Set(), edges: new Set() };

  function addNodeFromText({ start, end, text }) {
    const nodeId = matchSpan(spans, start, end);
    const label = tidyLabel(text);
    const { node, existed } = model.addNode({ nodeId, label, start, end, text, ...canvas.nextFreePosition(label) });
    if (existed) {
      canvas.flash(node.uid);
      log('add_node_duplicate', { uid: node.uid, text, start, end });
      persist();
    }
  }

  model.addEventListener('change', (e) => {
    const { action, log: data } = e.detail;
    log(action, data);
    if (action !== 'move') {
      if (flagged.nodes.size || flagged.edges.size) {
        flagged = { nodes: new Set(), edges: new Set() };
        canvas.setFlags(flagged);
      }
      feedback.markStale();
    }
    persist();
    syncHighlights();
    updateFooter(canvas.selection());
  });

  function persist() {
    state.graph = model.toJSON();
    save();
  }

  function syncHighlights() {
    const range = (n) => ({ start: n.start, end: n.end });
    panel.setRanges(model.nodes.map(range), model.nodes.filter((n) => flagged.nodes.has(n.uid)).map(range));
  }

  function updateFooter(sel) {
    footerText.textContent =
      sel?.kind === 'edge' ? 'Relation selected: click a type above to change it, or press Delete.'
      : sel?.kind === 'node' ? 'Node selected: drag to move, double-click to rename, Delete to remove.'
      : 'Drag from a node’s ● handle to another node, then pick a relation type.';
    deleteBtn.hidden = !sel;
    footerCount.textContent = `${model.nodes.length} nodes · ${model.edges.length} relations`;
  }

  function check() {
    const graph = model.toJSON();
    const res = scoreGraph(scenario, graph);
    const hints = buildHints(scenario, graph, res, CONFIG.MAX_HINTS);
    state.checks += 1;
    log('check', { ...summarize(res), hints: hints.map((x) => x.text) });
    persist();
    flagged = { nodes: new Set(res.flags.nodes), edges: new Set(res.flags.edges) };
    canvas.setFlags(flagged);
    syncHighlights();
    feedback.showResult(res, hints, state.checks);
  }

  function finish(reflection) {
    log('submit');
    const endedAt = Date.now();
    const graph = model.toJSON();
    state.completedAt = endedAt;
    persist();
    onComplete({
      submissionId: `${session.sessionId}-${step.id}`,
      sessionId: session.sessionId,
      pid: session.pid,
      condition: session.condition,
      appVersion: CONFIG.APP_VERSION,
      stepId: step.id,
      stepIndex: session.stepIndex,
      scenarioId: scenario.id,
      difficulty: scenario.difficulty,
      domain: scenario.domain,
      design: scenario.design || null,
      params: computeParams(scenario),
      feedbackMode: feedbackOn ? 'live' : 'none',
      startedAt: new Date(state.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationMs: endedAt - state.startedAt,
      checks: state.checks,
      score: scorable ? summarize(scoreGraph(scenario, graph)) : null, // assessments are scored offline
      reflection,
      graph,
      events: state.events,
      userAgent: navigator.userAgent,
    });
  }

  syncHighlights();
  updateFooter(null);

  return {
    destroy() {
      canvas.destroy();
      panel.destroy();
    },
  };
}
