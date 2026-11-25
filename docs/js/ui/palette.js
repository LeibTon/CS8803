// Relation palette: legend for the six relation types. Clicking a type retypes the selected relation.

import { RELATIONS, REL } from '../relations.js';
import { h } from './dom.js';
import { relGlyph } from './glyph.js';

const IDLE = 'Hover a type to see what it means. To change a relation’s type, click the relation on the canvas, then click a type here.';

export function createPalette(host, { onPick }) {
  const desc = h('div.palette-desc', {}, IDLE);
  let active = null;
  const describe = (r) => {
    desc.textContent = r ? `${r.label}: A → B means “${r.meaning}” (e.g. ${r.example}).` : IDLE;
    desc.classList.remove('nudge');
  };

  const buttons = new Map(RELATIONS.map((r) => [r.id,
    h('button.rel-btn', {
      type: 'button',
      style: { '--c': r.color },
      onClick: () => onPick(r.id),
      onMouseenter: () => describe(r),
      onMouseleave: () => describe(active && REL[active]),
      onFocus: () => describe(r),
    }, relGlyph(r), h('span', {}, r.label)),
  ]));

  host.append(h('div.eyebrow', {}, 'Relation type'), h('div.palette-row', {}, [...buttons.values()]), desc);

  return {
    setActive(id) {
      active = id || null;
      for (const [k, b] of buttons) b.classList.toggle('active', k === active);
      describe(active && REL[active]);
    },
    nudge() {
      desc.textContent = 'Select a relation on the canvas first, then click a type to change it. New relations are made by dragging from a node’s ● handle.';
      desc.classList.add('nudge');
    },
  };
}
