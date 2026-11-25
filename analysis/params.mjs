// Prints a Table-2-style summary of every scenario's parameters and flags anything outside the
// level targets in docs/js/scenarioParams.js. Run after adding or editing a scenario.
//
//   node analysis/params.mjs            table + warnings
//   node analysis/params.mjs --csv      CSV (paste into the report)

import { computeParams, checkScenario } from '../docs/js/scenarioParams.js';
import { loadScenarios, toCSV } from './lib.mjs';

const scenarios = Object.values(loadScenarios());
const rows = scenarios.map((s) => {
  const p = computeParams(s);
  return {
    id: s.id,
    difficulty: s.difficulty,
    domain: s.domain,
    familiarity: s.design?.domainFamiliarity ?? '',
    words: p.words,
    sentences: p.sentences,
    nodes: p.nodes,
    relations: p.requiredRelations,
    types: p.relationTypesUsed,
    inferred: p.inferredRelations,
    distractors: p.distractorPhrases,
    lures: p.lureRelations,
    validatedBy: s.generation?.validatedBy ?? '',
  };
});

if (process.argv.includes('--csv')) {
  process.stdout.write(toCSV(rows));
} else {
  console.table(rows);
  let problems = 0;
  for (const s of scenarios) {
    for (const w of checkScenario(s)) { console.warn(`⚠ ${s.id}: ${w}`); problems++; }
    if (!s.generation?.validatedBy && s.generation?.source === 'generative-ai') {
      console.warn(`· ${s.id}: reference graph not yet marked as instructor-validated (generation.validatedBy)`);
    }
  }
  console.log(problems ? `\n${problems} warning(s).` : '\nAll scenarios are within their level targets.');
}
