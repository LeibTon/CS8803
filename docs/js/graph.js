// The learner's graph. Emits:
//   'change' { action, log }  for every committed edit (logged + persisted)
//   'drag'                    while a node is being dragged (render only)

let counter = 0;
const newUid = (prefix) => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export class GraphModel extends EventTarget {
  constructor() {
    super();
    this.nodes = [];
    this.edges = [];
  }

  static fromJSON(json) {
    const m = new GraphModel();
    if (json) {
      m.nodes = json.nodes.map((n) => ({ ...n }));
      m.edges = json.edges.map((e) => ({ ...e }));
    }
    return m;
  }

  toJSON() {
    return { nodes: this.nodes.map((n) => ({ ...n })), edges: this.edges.map((e) => ({ ...e })) };
  }

  node(uid) { return this.nodes.find((n) => n.uid === uid); }
  edge(uid) { return this.edges.find((e) => e.uid === uid); }

  emit(action, log = {}) {
    this.dispatchEvent(new CustomEvent('change', { detail: { action, log } }));
  }

  /** Adds a node unless the same concept (same nodeId or overlapping text) is already on the canvas. */
  addNode({ nodeId = null, label, start, end, text, x, y }) {
    const dup = this.nodes.find(
      (n) =>
        (nodeId && n.nodeId === nodeId) ||
        (n.end > start && n.start < end) ||
        (!nodeId && !n.nodeId && n.label.toLowerCase() === label.toLowerCase()),
    );
    if (dup) return { node: dup, existed: true };
    const node = { uid: newUid('n'), nodeId, label, start, end, text, x: Math.round(x), y: Math.round(y) };
    this.nodes.push(node);
    this.emit('add_node', { uid: node.uid, nodeId, text, start, end });
    return { node, existed: false };
  }

  moveNode(uid, x, y, commit) {
    const n = this.node(uid);
    if (!n) return;
    n.x = Math.round(x);
    n.y = Math.round(y);
    if (commit) this.emit('move', { uid, x: n.x, y: n.y });
    else this.dispatchEvent(new Event('drag'));
  }

  renameNode(uid, label) {
    const n = this.node(uid);
    if (!n || n.label === label) return;
    const from = n.label;
    n.label = label;
    this.emit('rename_node', { uid, from, to: label });
  }

  removeNode(uid) {
    const n = this.node(uid);
    if (!n) return;
    const removedEdges = this.edges.filter((e) => e.from === uid || e.to === uid).map((e) => e.uid);
    this.nodes = this.nodes.filter((x) => x !== n);
    this.edges = this.edges.filter((e) => e.from !== uid && e.to !== uid);
    this.emit('remove_node', { uid, label: n.label, removedEdges });
  }

  /** One relation per ordered pair: connecting an already-connected pair changes its type. */
  addEdge(from, to, type) {
    if (from === to || !this.node(from) || !this.node(to)) return null;
    const existing = this.edges.find((e) => e.from === from && e.to === to);
    if (existing) {
      this.setEdgeType(existing.uid, type);
      return existing;
    }
    const edge = { uid: newUid('e'), from, to, type };
    this.edges.push(edge);
    this.emit('add_edge', { ...edge });
    return edge;
  }

  setEdgeType(uid, type) {
    const e = this.edge(uid);
    if (!e || e.type === type) return;
    const from = e.type;
    e.type = type;
    this.emit('change_type', { uid, from, to: type });
  }

  removeEdge(uid) {
    const e = this.edge(uid);
    if (!e) return;
    this.edges = this.edges.filter((x) => x !== e);
    this.emit('remove_edge', { ...e });
  }
}
