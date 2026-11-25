// Right-hand panel. Two modes:
//   live: score, counts and hints after each Check (practice / feedback condition)
//   none: no score or hints; optional reflection form (pre-test and transfer)

import { CONFIG } from '../config.js';
import { h } from './dom.js';

export function createFeedbackPanel(host, { live, reflection, requireCheck, checks = 0, onCheck, onNext }) {
  const result = h('div.result');
  const actions = h('div.actions');
  let checked = checks;
  let form = null;
  let checkBtn = null;
  let nextBtn = null;

  host.append(h('div.eyebrow', {}, live ? 'Feedback' : reflection ? 'Your reasoning' : 'No feedback'));

  if (live) {
    result.append(h('p.muted', {}, 'Build your network, then press Check to compare it with the reference. You can check as many times as you like.'));
    checkBtn = h('button.btn', { type: 'button', onClick: onCheck }, checked ? 'Check again' : 'Check');
    nextBtn = h('button.btn.primary', { type: 'button', onClick: () => onNext(null) }, 'Next scenario');
    actions.append(checkBtn, nextBtn);
    updateNext();
  } else {
    result.append(h('p.muted', {}, reflection
      ? 'This scenario has no score or hints. Build the network on your own, then explain how you did it.'
      : 'Feedback is not shown for this scenario. Build the network as well as you can, then continue.'));
    if (reflection) form = buildReflection();
    actions.append(h('button.btn.primary', { type: 'button', onClick: submitSilent }, reflection ? 'Submit' : 'Next scenario'));
  }
  host.append(...[result, form, actions].filter(Boolean));

  function updateNext() {
    const blocked = requireCheck && !checked;
    nextBtn.disabled = blocked;
    nextBtn.title = blocked ? 'Press Check at least once first' : '';
  }

  function submitSilent() {
    let data = null;
    if (form) {
      data = form.read();
      if (!data) return;
    }
    if (!window.confirm('Submit this network? You won’t be able to change it afterwards.')) return;
    onNext(data);
  }

  function buildReflection() {
    const name = `confidence-${Math.random().toString(36).slice(2)}`;
    const q1 = h('textarea', { rows: 5, placeholder: 'e.g. The text never says X directly, but because … I connected X and Y.' });
    const q2 = h('textarea', { rows: 3, placeholder: 'e.g. I left out … because …' });
    const err = h('div.form-error', { hidden: true });
    const min = CONFIG.MIN_REFLECTION_CHARS;
    const required = h('span.q-min', {}, ` (at least ${min} characters)`);
    // Live "n / min characters" counter under a textarea; turns green once the minimum is met.
    const counter = (ta) => {
      const c = h('div.char-count');
      const update = () => {
        const n = ta.value.trim().length;
        c.textContent = n >= min ? `${n} characters ✓` : `${n} / ${min} characters minimum`;
        c.classList.toggle('ok', n >= min);
      };
      ta.addEventListener('input', update);
      update();
      return c;
    };
    const el = h('div.reflection', {},
      h('label.q', {}, '1. How did you decide which phrases were concepts and which relations to draw? Name any relations you had to infer (ones not stated directly).', required.cloneNode(true)),
      q1,
      counter(q1),
      h('label.q', {}, '2. Which details did you leave out as extra, and why?', required),
      q2,
      counter(q2),
      h('div.q', {}, '3. How confident are you that your network is correct?'),
      h('div.likert', { role: 'radiogroup' },
        [1, 2, 3, 4, 5].map((v) => h('label', {}, h('input', { type: 'radio', name, value: v }), h('span', {}, v)))),
      h('div.likert-ends', {}, h('span', {}, 'Not at all'), h('span', {}, 'Very')),
      err);
    el.read = () => {
      const inference = q1.value.trim();
      const extraneous = q2.value.trim();
      const confidence = Number(el.querySelector(`input[name="${name}"]:checked`)?.value || 0);
      const problem =
        inference.length < min ? `Please write at least ${min} characters for question 1.`
        : extraneous.length < min ? `Please write at least ${min} characters for question 2.`
        : !confidence ? 'Please pick a confidence level.'
        : null;
      err.hidden = !problem;
      err.textContent = problem || '';
      return problem ? null : { inference, extraneous, confidence };
    };
    return el;
  }

  return {
    showResult(res, hints, checkCount) {
      checked = checkCount;
      checkBtn.textContent = 'Check again';
      updateNext();
      const pct = Math.round(res.recall * 100);
      result.classList.remove('stale');
      result.replaceChildren(
        h('div.score', {},
          h('span.score-big', {}, `${pct}%`),
          h('span.score-label', {}, `required relations found (${res.requiredFound} of ${res.requiredTotal})`)),
        h('div.meter', {}, h('div.meter-fill', { style: { width: `${pct}%` } })),
        h('dl.stats', {},
          h('dt', {}, 'Relations not in the reference'), h('dd', {}, res.extraRelations),
          h('dt', {}, 'Distractor phrases used'), h('dd', {}, res.distractorNodes)),
        h('div.hints', {}, hints.map((x) => h(`div.hint.${x.kind}`, {}, x.text))),
        h('p.stale-note', {}, 'You changed the network since the last check.'),
      );
    },
    markStale() {
      if (live && checked) result.classList.add('stale');
    },
  };
}
