// SVG canvas for the learner's network.
//   drag a node            → move it
//   drag from its ● handle → connect to another node, then pick a relation type
//   click                  → select (node or relation); double-click a node → rename
//   Delete / Backspace     → remove selection; Esc → deselect

import { RELATIONS, REL } from '../relations.js';
import { h, svg } from './dom.js';
import { ensureMarkers, relGlyph } from './glyph.js';

export const NODE_H = 32;
const FONT = '500 13px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const LABEL_FONT = '500 11px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const measure = document.createElement('canvas').getContext('2d');
const textWidth = (t, font = FONT) => ((measure.font = font), measure.measureText(t).width);
export const nodeWidth = (label) => Math.max(56, Math.ceil(textWidth(label)) + 28);

export function createCanvas(host, model, { readOnly = false, onSelect = () => {} } = {}) {
  ensureMarkers();
  host.classList.add('canvas-host');
  if (!readOnly) host.tabIndex = 0;

  const root = svg('svg', { class: `canvas${readOnly ? ' readonly' : ''}` });
  const edgeLayer = svg('g');
  const nodeLayer = svg('g');
  const tempLayer = svg('g', { class: 'temp' });
  root.append(edgeLayer, nodeLayer, tempLayer);
  host.append(root);
  const picker = readOnly ? null : createPicker(host);

  let selected = null;
  let flags = { nodes: new Set(), edges: new Set() };
  let drag = null;
  let flashUid = null;
  let lastTap = {};

  // ---------- rendering ----------
  function render() {
    edgeLayer.replaceChildren(...model.edges.map(renderEdge).filter(Boolean));
    nodeLayer.replaceChildren(...model.nodes.map(renderNode));
  }

  function renderNode(n) {
    const w = nodeWidth(n.label);
    const cls = ['node'];
    if (selected?.kind === 'node' && selected.uid === n.uid) cls.push('selected');
    if (flags.nodes.has(n.uid)) cls.push('flagged');
    if (flashUid === n.uid) cls.push('flash');
    const g = svg('g', { class: cls.join(' '), 'data-uid': n.uid, transform: `translate(${n.x - w / 2} ${n.y - NODE_H / 2})` },
      svg('rect', { class: 'node-box', width: w, height: NODE_H, rx: 8 }),
      svg('text', { class: 'node-label', x: w / 2, y: NODE_H / 2 + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, n.label));
    if (!readOnly) g.append(svg('circle', { class: 'handle', cx: w, cy: NODE_H / 2, r: 6 }, svg('title', {}, 'Drag to another node to connect')));
    if (flags.nodes.has(n.uid)) g.append(badge(w - 2, -2));
    return g;
  }

  function renderEdge(e) {
    const a = model.node(e.from);
    const b = model.node(e.to);
    if (!a || !b) return null;
    const rel = REL[e.type];

    // Spread parallel/opposite edges between the same two nodes.
    const siblings = model.edges.filter((o) => (o.from === e.from && o.to === e.to) || (o.from === e.to && o.to === e.from));
    const off = (siblings.indexOf(e) - (siblings.length - 1) / 2) * 18;
    const [p, q] = e.from < e.to ? [a, b] : [b, a];
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const nx = (-(q.y - p.y) / len) * off;
    const ny = ((q.x - p.x) / len) * off;

    const s = clip(a.x + nx, a.y + ny, nodeWidth(a.label), NODE_H, b.x + nx, b.y + ny, 2);
    const t = clip(b.x + nx, b.y + ny, nodeWidth(b.label), NODE_H, a.x + nx, a.y + ny, 3);
    const mx = (s.x + t.x) / 2;
    const my = (s.y + t.y) / 2;
    const lw = textWidth(rel.label, LABEL_FONT) + 10;

    const cls = ['edge'];
    if (selected?.kind === 'edge' && selected.uid === e.uid) cls.push('selected');
    if (flags.edges.has(e.uid)) cls.push('flagged');
    const g = svg('g', { class: cls.join(' '), 'data-edge': e.uid },
      svg('line', { class: 'edge-hit', x1: s.x, y1: s.y, x2: t.x, y2: t.y }),
      svg('line', { class: 'edge-line', x1: s.x, y1: s.y, x2: t.x, y2: t.y, stroke: rel.color, 'stroke-dasharray': rel.dash, 'marker-end': `url(#m-${e.type})` }),
      svg('rect', { class: 'edge-label-bg', x: mx - lw / 2, y: my - 8, width: lw, height: 16, rx: 4 }),
      svg('text', { class: 'edge-label', x: mx, y: my + 0.5, fill: rel.color, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, rel.label));
    if (flags.edges.has(e.uid)) g.append(badge(mx + lw / 2 + 8, my));
    return g;
  }

  const badge = (x, y) =>
    svg('g', { class: 'badge', transform: `translate(${x} ${y})` },
      svg('circle', { r: 8 }),
      svg('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', y: 0.5 }, '!'));

  // ---------- selection ----------
  function select(sel) {
    selected = sel;
    render();
    onSelect(selected);
  }

  function onModelChange() {
    if (selected && !(selected.kind === 'node' ? model.node(selected.uid) : model.edge(selected.uid))) selected = null;
    render();
    onSelect(selected);
  }
  model.addEventListener('change', onModelChange);
  model.addEventListener('drag', render);

  // ---------- pointer interaction ----------
  const local = (ev) => {
    const r = root.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };
  const nodeAt = (ev) => document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.node')?.dataset.uid || null;

  function clampPos(x, y, uid) {
    const half = nodeWidth(model.node(uid).label) / 2 + 4;
    const W = root.clientWidth;
    const H = root.clientHeight;
    return {
      x: Math.min(Math.max(x, half), Math.max(half, W - half)),
      y: Math.min(Math.max(y, NODE_H / 2 + 4), Math.max(NODE_H / 2 + 4, H - NODE_H / 2 - 4)),
    };
  }

  function onDown(ev) {
    if (ev.button !== 0) return;
    picker.close();
    host.focus({ preventScroll: true });
    const nodeEl = ev.target.closest('.node');
    const edgeEl = ev.target.closest('.edge');
    const p = local(ev);
    if (nodeEl && ev.target.closest('.handle')) {
      drag = { mode: 'connect', from: nodeEl.dataset.uid };
    } else if (nodeEl) {
      const n = model.node(nodeEl.dataset.uid);
      drag = { mode: 'move', uid: n.uid, dx: p.x - n.x, dy: p.y - n.y, sx: p.x, sy: p.y, moved: false };
    } else {
      select(edgeEl ? { kind: 'edge', uid: edgeEl.dataset.edge } : null);
      return;
    }
    root.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  }

  function onMove(ev) {
    if (!drag) return;
    const p = local(ev);
    if (drag.mode === 'move') {
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) < 3) return;
      drag.moved = true;
      const c = clampPos(p.x - drag.dx, p.y - drag.dy, drag.uid);
      model.moveNode(drag.uid, c.x, c.y, false);
    } else {
      const from = model.node(drag.from);
      const target = nodeAt(ev);
      tempLayer.replaceChildren(svg('line', { class: 'temp-line', x1: from.x, y1: from.y, x2: p.x, y2: p.y }));
      nodeLayer.querySelectorAll('.node').forEach((el) =>
        el.classList.toggle('drop-target', el.dataset.uid === target && target !== drag.from));
    }
  }

  function onUp(ev) {
    if (!drag) return;
    const d = drag;
    drag = null;
    tempLayer.replaceChildren();
    if (root.hasPointerCapture(ev.pointerId)) root.releasePointerCapture(ev.pointerId);

    if (d.mode === 'move') {
      if (d.moved) {
        const n = model.node(d.uid);
        model.moveNode(d.uid, n.x, n.y, true);
        return;
      }
      const now = Date.now();
      if (lastTap.uid === d.uid && now - lastTap.t < 400) {
        lastTap = {};
        rename(d.uid);
      } else {
        lastTap = { uid: d.uid, t: now };
        select({ kind: 'node', uid: d.uid });
      }
      return;
    }

    const to = nodeAt(ev);
    render();
    if (to && to !== d.from) {
      const p = local(ev);
      picker.open(p.x, p.y, (type) => {
        const e = model.addEdge(d.from, to, type);
        if (e) select({ kind: 'edge', uid: e.uid });
      });
    }
  }

  function cancelDrag() {
    drag = null;
    tempLayer.replaceChildren();
    render();
  }

  function rename(uid) {
    const n = model.node(uid);
    const v = window.prompt('Rename this node:', n.label);
    if (v && v.trim()) model.renameNode(uid, v.trim().slice(0, 60));
  }

  function deleteSelection() {
    if (!selected) return;
    if (selected.kind === 'node') model.removeNode(selected.uid);
    else model.removeEdge(selected.uid);
    select(null);
  }

  function onKey(ev) {
    if (picker.isOpen()) {
      if (ev.key === 'Escape') picker.close();
      return;
    }
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && selected) {
      ev.preventDefault();
      deleteSelection();
    } else if (ev.key === 'Escape') {
      select(null);
    }
  }

  if (!readOnly) {
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', cancelDrag);
    host.addEventListener('keydown', onKey);
  }

  render();

  return {
    selection: () => selected,
    setFlags(f) { flags = f; render(); },
    flash(uid) {
      flashUid = uid;
      render();
      setTimeout(() => { if (flashUid === uid) { flashUid = null; render(); } }, 700);
    },
    /** First free spot (scanning rows) with room for a node with this label and a visible edge gap. */
    nextFreePosition(label = '') {
      const W = Math.max(root.clientWidth, 300);
      const H = Math.max(root.clientHeight, 240);
      const w = nodeWidth(label);
      // 110px horizontal gap leaves room for an edge label between neighbours.
      const fits = (x, y) => model.nodes.every((n) =>
        Math.abs(n.x - x) > (nodeWidth(n.label) + w) / 2 + 110 || Math.abs(n.y - y) > NODE_H + 40);
      for (let y = 44; y <= H - 24; y += 80) {
        for (let x = w / 2 + 20; x <= W - w / 2 - 20; x += 20) if (fits(x, y)) return { x, y };
      }
      return { x: w / 2 + 20 + Math.random() * Math.max(0, W - w - 40), y: 40 + Math.random() * (H - 80) };
    },
    deleteSelection,
    destroy() {
      model.removeEventListener('change', onModelChange);
      model.removeEventListener('drag', render);
    },
  };
}

/** Point where the segment from a box's centre toward (tx, ty) leaves the box. */
function clip(cx, cy, w, h, tx, ty, pad = 0) {
  const dx = tx - cx;
  const dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const sx = dx ? (w / 2 + pad) / Math.abs(dx) : Infinity;
  const sy = dy ? (h / 2 + pad) / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

function createPicker(host) {
  let onPick = null;
  const el = h('div.rel-picker', { hidden: true, role: 'menu' },
    h('div.rel-picker-title', {}, 'Relation type'),
    RELATIONS.map((r) =>
      h('button.rel-option', {
        type: 'button', title: `A → B: ${r.meaning}`,
        onClick: () => { const cb = onPick; close(); cb?.(r.id); },
      }, relGlyph(r), h('span', {}, r.label))),
    h('button.rel-cancel', { type: 'button', onClick: () => close() }, 'Cancel'));
  host.append(el);

  function open(x, y, cb) {
    onPick = cb;
    el.hidden = false;
    el.style.left = `${Math.max(8, Math.min(x + 8, host.clientWidth - el.offsetWidth - 8))}px`;
    el.style.top = `${Math.max(8, Math.min(y + 8, host.clientHeight - el.offsetHeight - 8))}px`;
    el.querySelector('.rel-option').focus();
  }
  function close() {
    if (el.hidden) return;
    el.hidden = true;
    onPick = null;
    host.focus({ preventScroll: true });
  }
  return { open, close, isOpen: () => !el.hidden };
}
