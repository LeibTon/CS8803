// Re-scores every response against the answer keys (including the no-feedback assessments,
// which the browser cannot score) and writes one tidy row per participant × scenario.
//
//   node analysis/score.mjs responses.csv > scored.csv     (CSV downloaded from the Google Sheet)
//   node analysis/score.mjs export1.json export2.json …    (files from "Download my data")
//   node analysis/score.mjs --verify                       (only check answer keys match the site text)
//
// Nodes are re-matched from their character offsets, so editing node tags in an answer key and
// re-running re-scores old data consistently.

import { readFileSync } from 'node:fs';
import { parseMarkup, matchSpan } from '../docs/js/markup.js';
import { scoreGraph, summarize } from '../docs/js/scoring.js';
import { computeParams } from '../docs/js/scenarioParams.js';
import { loadScenarios, parseCSV, toCSV } from './lib.mjs';

const scenarios = loadScenarios();
const args = process.argv.slice(2);
if (args[0] === '--verify') {
  console.error(`OK: ${Object.keys(scenarios).length} scenarios, answer keys match the site text.`);
  process.exit(0);
}
if (!args.length) {
  console.error('usage: node analysis/score.mjs <responses.csv | export.json ...> > scored.csv');
  process.exit(1);
}

// Normalise both input formats to { record, graph }.
const inputs = [];
for (const file of args) {
  const text = readFileSync(file, 'utf8');
  if (file.endsWith('.json')) {
    for (const rec of JSON.parse(text).records || []) inputs.push(rec);
  } else {
    for (const row of parseCSV(text)) {
      inputs.push({
        submissionId: row.submission_id, sessionId: row.session_id, pid: row.pid, condition: row.condition,
        stepIndex: row.step_index, stepId: row.step_id, scenarioId: row.scenario_id, feedbackMode: row.feedback_mode,
        durationMs: Number(row.duration_ms), checks: Number(row.checks),
        reflection: { inference: row.reflection_inference, extraneous: row.reflection_extraneous, confidence: row.confidence },
        graph: row.graph_json ? JSON.parse(row.graph_json) : { nodes: [], edges: [] },
        startedAt: row.started_at,
      });
    }
  }
}

const seen = new Set();
const out = [];
for (const rec of inputs) {
  if (seen.has(rec.submissionId)) continue;
  seen.add(rec.submissionId);
  const sc = scenarios[rec.scenarioId];
  if (!sc) { console.error(`skipping ${rec.submissionId}: unknown scenario ${rec.scenarioId}`); continue; }
  const { spans } = parseMarkup(sc.markup);
  const graph = {
    nodes: rec.graph.nodes.map((n) => ({ ...n, nodeId: matchSpan(spans, n.start, n.end) })),
    edges: rec.graph.edges,
  };
  const s = summarize(scoreGraph(sc, graph));
  const p = computeParams(sc);
  out.push({
    pid: rec.pid,
    session_id: rec.sessionId,
    condition: rec.condition,
    step_index: rec.stepIndex,
    step_id: rec.stepId,
    scenario_id: rec.scenarioId,
    difficulty: sc.difficulty,
    domain: sc.domain,
    domain_familiarity: sc.design?.domainFamiliarity ?? '',
    explicitness: sc.design?.explicitness ?? '',
    extraneous_detail: sc.design?.extraneousDetail ?? '',
    feedback_mode: rec.feedbackMode,
    // scenario parameters (Table 2)
    p_words: p.words,
    p_nodes: p.nodes,
    p_required_relations: p.requiredRelations,
    p_relation_types: p.relationTypesUsed,
    p_inferred: p.inferredRelations,
    p_distractors: p.distractorPhrases,
    p_lures: p.lureRelations,
    // learner performance
    recall: s.recall,
    precision: s.precision,
    f1: s.f1,
    required_found: s.requiredFound,
    required_total: s.requiredTotal,
    inferred_found: s.inferredFound,
    inferred_total: s.inferredTotal,
    extra_relations: s.extraRelations,
    lure_relations: s.lureRelations,
    distractor_nodes: s.distractorNodes,
    extra_nodes: s.extraNodes,
    node_recall: s.nodesTotal ? Math.round((s.nodesFound / s.nodesTotal) * 1000) / 1000 : '',
    duration_s: Math.round((rec.durationMs || 0) / 1000),
    checks: rec.checks,
    confidence: rec.reflection?.confidence ?? '',
    reflection_inference: rec.reflection?.inference ?? '',
    reflection_extraneous: rec.reflection?.extraneous ?? '',
  });
}

out.sort((a, b) => String(a.pid).localeCompare(String(b.pid)) || Number(a.step_index) - Number(b.step_index));
process.stdout.write(toCSV(out));
console.error(`Scored ${out.length} responses.`);
