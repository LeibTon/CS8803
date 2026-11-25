// No-feedback assessment scenarios: plain text only, no answers, no phrase tags.
// The answer keys are in analysis/answer-keys.mjs. If you edit text here, edit the markup there
// identically. `npm run verify-keys` checks that they match character for character.
// design/generation have the same meaning as in scenarios.js (see scenarioParams.js).
//
// The two scenarios are PARALLEL FORMS: same length, same reference-graph structure (3 requires,
// 2 is_a [both inferred], 1 produces, 1 decreases), 2 distractor phrases and 2 lure relations,
// each in an unfamiliar regulatory domain. config.js counterbalances them: half the participants
// get the marina scenario as the pre-test and the food truck as transfer, the other half the reverse.
// So a pre→post difference can't come from one form being easier than the other.
// Keep them matched if you edit either (npm run params shows both side by side).

const gen = {
  source: 'generative-ai',
  model: 'TODO: model name/version used',
  promptVersion: 'analysis/scenario-prompt.md@v1',
  generatedOn: null,
  validatedBy: null,
};

const design = { level: 5, domainFamiliarity: 'unfamiliar', explicitness: 'implicit', extraneousDetail: 'high', purpose: 'assessment' };

export const ASSESSMENTS = {
  'assess-food-truck': {
    id: 'assess-food-truck',
    title: 'A food truck permit',
    difficulty: 'assessment',
    domain: 'City regulation',
    design,
    generation: gen,
    text:
      'Maria wants to sell tacos from a food truck downtown. The city issues a vending permit only after the truck passes a fire inspection, ' +
      'and inspectors will not inspect a truck until its propane tank is certified. The inspection also checks for fire-safety equipment; ' +
      'a fire extinguisher mounted by the door counts. Parking within 15 feet of a hydrant earns the truck a citation, and each citation ' +
      'makes renewal of the permit less likely. Maria’s cousin painted the truck orange. Last month Maria left the truck by a hydrant ' +
      'while buying ice, and she insists the citation was unfair.',
  },

  'assess-marina': {
    id: 'assess-marina',
    title: 'A marina boat slip',
    difficulty: 'assessment',
    domain: 'Harbor regulation',
    design,
    generation: gen,
    text:
      'Omar wants to keep his sailboat at the city marina. The harbormaster assigns a boat slip only after the boat passes a safety check, ' +
      'and staff will not schedule a check until its hull registration is current. The check also looks for flotation devices; ' +
      'a life ring hung on the rail counts. Running the engine after 10 at night earns the owner a noise warning, and each warning ' +
      'makes renewal of the slip lease less likely. Omar’s uncle named the boat Gull. Last week Omar ran the engine past midnight ' +
      'while fixing the bilge pump, and he insists the warning was unfair.',
  },
};
