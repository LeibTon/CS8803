// Full-page screens: welcome, tutorial (worked example), done.

import { CONFIG } from '../config.js';
import { RELATIONS } from '../relations.js';
import { GraphModel } from '../graph.js';
import { parseMarkup } from '../markup.js';
import { h } from './dom.js';
import { relGlyph } from './glyph.js';
import { createCanvas } from './canvas.js';

// The participant ID is never asked for: it comes from ?pid= if present, otherwise main.js
// assigns a random one (P-XXXXXX).
export function renderWelcome(root, { onStart }) {
  const start = h('button.btn.primary', { type: 'button', id: 'start' }, 'Start');
  start.addEventListener('click', () => onStart());

  root.className = 'app page';
  root.replaceChildren(h('div.card.narrow', {},
    h('h1', {}, CONFIG.STUDY_TITLE),
    h('div.intro', { html: CONFIG.INTRO_HTML }),
    h('div.actions.end', {}, start)));
}

export function renderTutorial(root, { scenario, onContinue }) {
  root.className = 'app page';
  const { plain, spans } = parseMarkup(scenario.markup);

  // Example text with every concept phrase highlighted.
  const text = h('p.scenario-text');
  let last = 0;
  for (const s of spans) {
    text.append(plain.slice(last, s.start), h('mark.added', {}, plain.slice(s.start, s.end)));
    last = s.end;
  }
  text.append(plain.slice(last));

  // Read-only reference graph using the canvas component.
  const model = GraphModel.fromJSON({
    nodes: Object.entries(scenario.nodes).map(([id, n]) => ({
      uid: id, nodeId: id, label: n.label, x: scenario.layout[id][0], y: scenario.layout[id][1],
    })),
    edges: scenario.relations.map((r, i) => ({ uid: `e${i}`, from: r.from, to: r.to, type: r.type })),
  });
  const canvasHost = h('div.canvas-wrap.example');

  root.replaceChildren(h('div.card.wide', {},
    h('h1', {}, 'How this works'),
    h('p', {}, 'In each scenario you’ll read a short text and turn it into a ', h('strong', {}, 'semantic network'),
      ': the nodes are the concepts in the text and the arrows are the relations between them. ',
      'Every scenario uses the same six relation types. Some texts include details that don’t belong in the network, ',
      'and some relations are only implied, not stated outright.'),

    h('h2', {}, 'The six relation types'),
    h('table.rel-table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Relation'), h('th', {}, 'A → B means'), h('th', {}, 'Example'))),
      h('tbody', {}, RELATIONS.map((r) =>
        h('tr', {}, h('td', {}, h('span.rel-name', {}, relGlyph(r), r.label)), h('td', {}, r.meaning), h('td', {}, r.example))))),

    h('h2', {}, 'Worked example'),
    h('div.example-grid', {},
      h('div', {}, h('div.eyebrow', {}, scenario.title), text),
      canvasHost),
    h('ul.explain', {}, scenario.relations.map((r) =>
      h('li', {}, h('strong', {}, `${scenario.nodes[r.from].label} → ${scenario.nodes[r.to].label}`),
        ` (${RELATIONS.find((x) => x.id === r.type).label}): ${r.explain}`)),
      h('li', {}, h('strong', {}, 'Left out: '), 'the colour of the garden gate. It doesn’t connect to anything, so it’s extra detail.')),

    h('h2', {}, 'Using the builder'),
    h('ol.howto', {},
      h('li', {}, 'Select a word or phrase in the scenario text (click and drag), then press ', h('kbd', {}, '+ Add node'), '.'),
      h('li', {}, 'Drag from the small ', h('strong', {}, '●'), ' on a node’s right edge to another node, then pick the relation type.'),
      h('li', {}, 'Click a relation to select it, then click a type in the palette to change it. ',
        'Press ', h('kbd', {}, 'Delete'), ' to remove the selected node or relation. Double-click a node to rename it. Drag nodes to tidy up.'),
      h('li', {}, 'In practice scenarios, press ', h('strong', {}, 'Check'), ' to compare your network with the reference. ',
        'Some scenarios give no feedback. Just do your best.')),
    h('div.actions.end', {}, h('button.btn.primary', { type: 'button', onClick: onContinue }, 'Start'))));

  // The canvas measures its host, so create it after the host is in the document.
  const canvas = createCanvas(canvasHost, model, { readOnly: true });
  return { destroy: () => canvas.destroy() };
}

export function renderDone(root, { pid, pending, endpointSet, returnUrl, onRetry, onDownload }) {
  root.className = 'app page';
  const status = !endpointSet
    ? h('div.notice.warn', {}, 'Test mode: no ENDPOINT is configured, so responses were only saved in this browser. Use “Download my data”.')
    : pending
      ? h('div.notice.warn', {}, `${pending} response${pending > 1 ? 's have' : ' has'} not reached the server yet. Keep this page open and press Retry, or download your data and send it to the study team.`)
      : h('div.notice.good', {}, 'All your responses have been saved.');

  root.replaceChildren(h('div.card.narrow', {},
    h('h1', {}, 'Thank you!'),
    h('p', {}, 'You’ve finished all the scenarios.'),
    status,
    h('p', {}, 'Your participant ID: ', h('code.pid', {}, pid)),
    h('div.actions', {},
      endpointSet && pending ? h('button.btn', { type: 'button', onClick: onRetry }, 'Retry upload') : null,
      h('button.btn', { type: 'button', onClick: onDownload }, 'Download my data'),
      returnUrl ? h('a.btn.primary', { href: returnUrl }, 'Continue to the final survey') : null)));
}
