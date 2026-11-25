// Header progress bar: fixed order of task steps.

import { h } from './dom.js';

export function renderProgress(host, taskSteps, doneIds, currentId) {
  host.replaceChildren(
    ...taskSteps.flatMap((s, i) => {
      const state = doneIds.has(s.id) ? 'done' : s.id === currentId ? 'current' : 'todo';
      const item = h(`div.step.${state}`, { 'aria-current': state === 'current' ? 'step' : null },
        h('span.dot', {}, state === 'done' ? '✓' : String(i + 1)),
        h('span.step-label', {}, s.label));
      return i ? [h('span.sep'), item] : [item];
    }),
  );
}
