// Arrowhead markers for each relation type (defined once per page) and small legend glyphs.

import { RELATIONS } from '../relations.js';
import { svg } from './dom.js';

let installed = false;

export function ensureMarkers() {
  if (installed) return;
  installed = true;
  const defs = svg('defs', {}, RELATIONS.map(markerFor));
  document.body.prepend(svg('svg', { width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute' }, defs));
}

function markerFor(r) {
  const base = { id: `m-${r.id}`, markerUnits: 'userSpaceOnUse', orient: 'auto' };
  if (r.marker === 'bar') {
    return svg('marker', { ...base, viewBox: '0 0 6 16', refX: 4, refY: 8, markerWidth: 6, markerHeight: 16 },
      svg('path', { d: 'M3,1 L3,15', stroke: r.color, 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  }
  if (r.marker === 'hollow') {
    return svg('marker', { ...base, viewBox: '0 0 14 14', refX: 13, refY: 7, markerWidth: 13, markerHeight: 13 },
      svg('path', { d: 'M1,1.5 L13,7 L1,12.5 Z', fill: '#fff', stroke: r.color, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }));
  }
  return svg('marker', { ...base, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 10, markerHeight: 10 },
    svg('path', { d: 'M0,0.5 L10,5 L0,9.5 Z', fill: r.color }));
}

export function relGlyph(r, w = 30) {
  ensureMarkers();
  return svg('svg', { class: 'glyph', width: w, height: 14, viewBox: `0 0 ${w} 14`, 'aria-hidden': 'true' },
    svg('line', { x1: 2, y1: 7, x2: w - 3, y2: 7, stroke: r.color, 'stroke-width': 1.6, 'stroke-dasharray': r.dash, 'marker-end': `url(#m-${r.id})` }));
}
