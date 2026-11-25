// Scenario parameters (the "knobs" from Table 2 of the proposal).
//
// Two kinds of parameters:
//   1. design: declared by hand on each scenario (what the author intended)
//        level             ordinal position in the progression (0 example, 1 practice/pre-test, 2 easy, 3 medium, 4 hard, 5 transfer)
//        domainFamiliarity 'everyday' | 'stem' | 'unfamiliar'   (participants are assumed to be STEM students)
//        explicitness      'explicit' | 'mixed' | 'implicit'      (how often relations are stated outright)
//        extraneousDetail  'low' | 'medium' | 'high'
//        purpose           'example' | 'practice' | 'learning' | 'assessment'
//      plus generation provenance (which model/prompt produced it, who validated the answer key).
//   2. measured: computed from the scenario data by computeParams(), so they can't drift from the content:
//        words, sentences, nodes, requiredRelations, relationTypesUsed, inferredRelations,
//        explicitRelations, distractorPhrases, lureRelations, lurePhrases, taggedPhrases
//
// LEVEL_TARGETS encodes the intended progression; checkScenario() warns when a scenario falls outside it.
// Run `npm run params` to print a Table-2-style summary of every scenario with any warnings.

import { parseMarkup } from './markup.js';

export const LEVEL_TARGETS = {
  practice: { words: [20, 50],  nodes: [4, 7],  requiredRelations: [3, 6], inferredRelations: [0, 0], distractorPhrases: [1, 1], lureRelations: [0, 0] },
  easy:     { words: [25, 50],  nodes: [5, 7],  requiredRelations: [4, 6], inferredRelations: [0, 0], distractorPhrases: [1, 1], lureRelations: [0, 0] },
  medium:   { words: [45, 80],  nodes: [6, 8],  requiredRelations: [5, 7], inferredRelations: [1, 3], distractorPhrases: [1, 2], lureRelations: [1, 2] },
  hard:     { words: [70, 115], nodes: [7, 10], requiredRelations: [6, 8], inferredRelations: [2, 4], distractorPhrases: [2, 3], lureRelations: [2, 4] },
  // Pre-test and transfer use the same target: they are parallel forms, counterbalanced in config.js.
  assessment: { words: [85, 115], nodes: [8, 10], requiredRelations: [7, 7], inferredRelations: [2, 2], distractorPhrases: [2, 2], lureRelations: [2, 2] },
};

const countWords = (t) => (t.match(/[A-Za-z0-9][\w'’,.-]*/g) || []).length;
const countSentences = (t) => (t.match(/[^.!?]+[.!?]+/g) || [t]).filter((s) => s.trim()).length;

/**
 * Measured parameters. `scenario` needs markup (or text) and, for graph metrics,
 * nodes/relations/lures. Assessments loaded in the browser have only text, so their
 * graph metrics come back null and are filled in offline from the answer keys.
 */
export function computeParams(scenario) {
  const { plain, spans } = parseMarkup(scenario.markup ?? scenario.text ?? '');
  const base = { words: countWords(plain), sentences: countSentences(plain) };
  if (!scenario.relations) {
    return { ...base, nodes: null, requiredRelations: null, relationTypesUsed: null, relationTypes: null,
      inferredRelations: null, explicitRelations: null, distractorPhrases: null, lureRelations: null, lurePhrases: null, taggedPhrases: null };
  }
  const kinds = Object.values(scenario.nodes).map((n) => n.kind || 'reference');
  const types = [...new Set(scenario.relations.map((r) => r.type))];
  const inferred = scenario.relations.filter((r) => r.inferred).length;
  return {
    ...base,
    nodes: kinds.filter((k) => k === 'reference').length,
    requiredRelations: scenario.relations.length,
    relationTypesUsed: types.length,
    relationTypes: types.join(' '),
    inferredRelations: inferred,
    explicitRelations: scenario.relations.length - inferred,
    distractorPhrases: kinds.filter((k) => k === 'distractor').length,
    lureRelations: (scenario.lures || []).length,
    lurePhrases: kinds.filter((k) => k === 'lure').length,
    taggedPhrases: spans.length,
  };
}

/** Consistency checks + comparison with LEVEL_TARGETS. Returns a list of warning strings. */
export function checkScenario(scenario) {
  const warnings = [];
  const p = computeParams(scenario);
  if (scenario.relations) {
    const tagged = new Set(parseMarkup(scenario.markup).spans.map((s) => s.nodeId));
    for (const id of Object.keys(scenario.nodes)) if (!tagged.has(id)) warnings.push(`node "${id}" has no [phrase](${id}) in the text`);
    for (const id of tagged) if (!scenario.nodes[id]) warnings.push(`tag (${id}) has no entry in nodes`);
    for (const r of [...scenario.relations, ...(scenario.lures || [])]) {
      for (const end of [r.from, r.to]) if (!scenario.nodes[end]) warnings.push(`relation ${r.from} → ${r.to} uses unknown node "${end}"`);
    }
  }
  const target = LEVEL_TARGETS[scenario.difficulty];
  if (target) {
    for (const [k, [lo, hi]] of Object.entries(target)) {
      if (p[k] != null && (p[k] < lo || p[k] > hi)) warnings.push(`${k} = ${p[k]} is outside the ${scenario.difficulty} target ${lo}–${hi}`);
    }
  }
  return warnings;
}
