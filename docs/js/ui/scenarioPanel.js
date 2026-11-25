// Scenario text panel. The learner selects words, then presses "+ Add node".
// Text already used as a node is highlighted; after a Check, text behind flagged nodes turns orange.
// Phrase tags are never written into the DOM, so inspecting the page doesn't reveal the concepts.

import { h } from './dom.js';
import { snapToWords } from '../markup.js';

const MAX_SELECTION = 80;

export function createScenarioPanel(host, { eyebrow, title, plain, onAddNode }) {
  const body = h('div.scenario-text');
  const addBtn = h('button.add-node-btn', { type: 'button', hidden: true }, '+ Add node');
  host.append(
    h('div.eyebrow', {}, eyebrow),
    h('h2.scenario-title', {}, title),
    h('div.instruction', {}, 'Select a phrase in the text to add it as a node.'),
    body,
    h('div.legend', {},
      h('span', {}, h('i.swatch.added'), 'Added as node'),
      h('span', {}, h('i.swatch.flagged'), 'Flagged by check')),
    addBtn,
  );

  let added = [];
  let flagged = [];
  let pending = null;

  function render() {
    const cuts = new Set([0, plain.length]);
    for (const r of [...added, ...flagged]) { cuts.add(r.start); cuts.add(r.end); }
    const pts = [...cuts].sort((a, b) => a - b);
    const parts = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const s = pts[i];
      const e = pts[i + 1];
      const within = (r) => r.start < e && r.end > s;
      const text = plain.slice(s, e);
      if (flagged.some(within)) parts.push(h('mark.flagged', {}, text));
      else if (added.some(within)) parts.push(h('mark.added', {}, text));
      else parts.push(document.createTextNode(text));
    }
    body.replaceChildren(...parts);
  }

  const charOffset = (node, offset) => {
    const r = document.createRange();
    r.setStart(body, 0);
    r.setEnd(node, offset);
    return r.toString().length;
  };

  function hide() {
    addBtn.hidden = true;
    pending = null;
  }

  function capture() {
    if (!body.isConnected) return;
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return hide();
    const range = sel.getRangeAt(0);
    if (!body.contains(range.startContainer) || !body.contains(range.endContainer)) return hide();
    const { start, end } = snapToWords(plain, charOffset(range.startContainer, range.startOffset), charOffset(range.endContainer, range.endOffset));
    if (end <= start || end - start > MAX_SELECTION) return hide();
    pending = { start, end, text: plain.slice(start, end) };
    const rect = range.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    addBtn.hidden = false;
    addBtn.style.left = `${Math.min(rect.left - hostRect.left, host.clientWidth - addBtn.offsetWidth - 8)}px`;
    addBtn.style.top = `${rect.bottom - hostRect.top + host.scrollTop + 6}px`;
  }

  let timer = null;
  const onSelectionChange = () => {
    clearTimeout(timer);
    timer = setTimeout(capture, 120);
  };
  document.addEventListener('selectionchange', onSelectionChange);

  addBtn.addEventListener('pointerdown', (e) => e.preventDefault()); // keep the text selection
  addBtn.addEventListener('click', () => {
    const p = pending;
    getSelection().removeAllRanges();
    hide();
    if (p) onAddNode(p);
  });

  render();

  return {
    setRanges(addedRanges, flaggedRanges) {
      added = addedRanges;
      flagged = flaggedRanges;
      render();
    },
    destroy() {
      document.removeEventListener('selectionchange', onSelectionChange);
      clearTimeout(timer);
    },
  };
}
