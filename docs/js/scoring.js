// Compares a learner graph with a scenario's reference graph. Pure (no DOM), shared with analysis/.
//
// scenario: { nodes: { id: { label, kind?: 'reference'|'distractor'|'lure', note? } },
//             relations: [{ from, to, type, inferred?, hint? }], lures?: [{ from, to, type, note? }] }
// graph:    { nodes: [{ uid, nodeId|null, label }], edges: [{ uid, from, to, type }] }  (edge from/to are node uids)

const key = (a, b, t) => `${a}|${b}|${t}`;

export function scoreGraph(scenario, graph) {
  const byUid = new Map(graph.nodes.map((n) => [n.uid, n]));
  const kindOf = (id) => (id ? scenario.nodes[id]?.kind || 'reference' : 'free');

  const relKeys = new Map(scenario.relations.map((r) => [key(r.from, r.to, r.type), r]));
  const lureKeys = new Map((scenario.lures || []).map((l) => [key(l.from, l.to, l.type), l]));

  const matched = new Set();
  const extraEdges = [];
  const lureEdges = [];
  for (const e of graph.edges) {
    const a = byUid.get(e.from);
    const b = byUid.get(e.to);
    if (!a || !b) continue;
    const k = a.nodeId && b.nodeId ? key(a.nodeId, b.nodeId, e.type) : null;
    if (k && relKeys.has(k)) { matched.add(k); continue; } // duplicates of a matched relation are ignored
    extraEdges.push(e.uid);
    if (k && lureKeys.has(k)) lureEdges.push({ uid: e.uid, lure: lureKeys.get(k) });
  }

  const refIds = Object.keys(scenario.nodes).filter((id) => kindOf(id) === 'reference');
  const present = new Set(graph.nodes.map((n) => n.nodeId).filter(Boolean));
  const nodesFound = refIds.filter((id) => present.has(id)).length;
  const extraNodes = graph.nodes.filter((n) => kindOf(n.nodeId) !== 'reference');
  const distractorIds = [...new Set(extraNodes.filter((n) => kindOf(n.nodeId) === 'distractor').map((n) => n.nodeId))];

  const total = scenario.relations.length;
  const found = matched.size;
  const recall = total ? found / total : 0;
  const precision = found + extraEdges.length ? found / (found + extraEdges.length) : 0;
  const f1 = recall + precision ? (2 * recall * precision) / (recall + precision) : 0;
  const inferred = scenario.relations.filter((r) => r.inferred);

  return {
    requiredTotal: total,
    requiredFound: found,
    recall,
    precision,
    f1,
    extraRelations: extraEdges.length,
    lureRelations: lureEdges.length,
    distractorNodes: distractorIds.length,
    extraNodes: extraNodes.length,
    nodesFound,
    nodesTotal: refIds.length,
    nodeRecall: refIds.length ? nodesFound / refIds.length : 0,
    inferredFound: inferred.filter((r) => matched.has(key(r.from, r.to, r.type))).length,
    inferredTotal: inferred.length,
    missing: scenario.relations.filter((r) => !matched.has(key(r.from, r.to, r.type))),
    lureEdges,
    distractorIds,
    flags: { edges: extraEdges, nodes: extraNodes.map((n) => n.uid) },
  };
}

/** Numeric fields only, for logging. */
export function summarize(res) {
  const round = (x) => Math.round(x * 1000) / 1000;
  return {
    requiredFound: res.requiredFound,
    requiredTotal: res.requiredTotal,
    recall: round(res.recall),
    precision: round(res.precision),
    f1: round(res.f1),
    extraRelations: res.extraRelations,
    lureRelations: res.lureRelations,
    distractorNodes: res.distractorNodes,
    extraNodes: res.extraNodes,
    nodesFound: res.nodesFound,
    nodesTotal: res.nodesTotal,
    inferredFound: res.inferredFound,
    inferredTotal: res.inferredTotal,
  };
}

/**
 * Hints that name a node pair or a sentence without giving the answer away.
 * Returns [{ kind: 'warn'|'info'|'good', text }], most useful first.
 */
export function buildHints(scenario, graph, res, max = 3) {
  const byUid = new Map(graph.nodes.map((n) => [n.uid, n]));
  const idOf = (uid) => byUid.get(uid)?.nodeId;
  const learnerNode = (id) => graph.nodes.find((n) => n.nodeId === id);

  const pairHints = [];
  const missingUnseen = [];
  for (const r of res.missing) {
    const A = learnerNode(r.from);
    const B = learnerNode(r.to);
    if (!A || !B) { missingUnseen.push(r); continue; }
    const same = graph.edges.find((e) => idOf(e.from) === r.from && idOf(e.to) === r.to);
    const rev = graph.edges.find((e) => idOf(e.from) === r.to && idOf(e.to) === r.from);
    if (same) pairHints.push({ kind: 'warn', text: `${A.label} → ${B.label}: right pair, wrong relation type.` });
    else if (rev && rev.type === r.type) pairHints.push({ kind: 'warn', text: `${B.label} → ${A.label}: right relation, but check the direction of the arrow.` });
    else if (rev) pairHints.push({ kind: 'warn', text: `${B.label} and ${A.label} are related, but check the direction and the type.` });
    else pairHints.push({ kind: 'info', text: `Something connects ${A.label} and ${B.label}. ${r.hint || ''}`.trim() });
  }

  const lureHints = res.lureEdges.map(({ uid, lure }) => {
    const e = graph.edges.find((x) => x.uid === uid);
    return { kind: 'warn', text: lure.note || `${byUid.get(e.from).label} → ${byUid.get(e.to).label} is not supported by the text.` };
  });

  const nodeHints = [];
  // Nodes already explained by a lure-edge hint don't get a second, overlapping hint.
  const seen = new Set(res.lureEdges.flatMap(({ lure }) => [lure.from, lure.to]));
  for (const uid of res.flags.nodes) {
    const n = byUid.get(uid);
    const id = n.nodeId || `free:${n.label.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const note = n.nodeId ? scenario.nodes[n.nodeId]?.note : null;
    nodeHints.push({ kind: 'warn', text: note || `“${n.label}” is not part of the network described.` });
  }

  const missingHints = [];
  if (missingUnseen.length) {
    const n = missingUnseen.length;
    missingHints.push({
      kind: 'info',
      text: `${n} relation${n > 1 ? 's are' : ' is'} missing. ${missingUnseen[0].hint || 'Reread the scenario.'}`,
    });
  }

  const hints = [...pairHints, ...lureHints, ...nodeHints, ...missingHints];
  if (!hints.length && res.requiredFound === res.requiredTotal && res.extraRelations === 0) {
    return [{ kind: 'good', text: 'Everything matches the reference network. Nice work!' }];
  }
  return hints.slice(0, max);
}
