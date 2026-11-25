// Answer keys for the no-feedback assessments. NOT served by GitHub Pages (only docs/ is published),
// so participants can't find them in the site's source. If the repository is public they are still
// visible on github.com. Keep the repo private (free with the GitHub Student Pack) or keep this file
// out of git.
//
// The markup must strip to exactly the text in docs/js/data/assessments.js (npm run verify-keys).

export const KEYS = {
  // Parallel forms (see docs/js/data/assessments.js). Node-for-node correspondence:
  //   permit↔slip, inspection↔check, propane↔registration, safety↔flotation, extinguisher↔ring,
  //   hydrant↔noise, citation↔warning, renewal↔renewal, lastmonth↔lastweek, paint↔name, ice↔pump.
  'assess-marina': {
    markup:
      'Omar wants to keep his sailboat at the city marina. The harbormaster assigns a [boat slip](slip) only after the boat passes a [safety check](check), ' +
      'and staff will not schedule a [check](check) until its [hull registration is current](registration). The [check](check) also looks for [flotation devices](flotation); ' +
      'a [life ring](ring) hung on the rail counts. [Running the engine after 10 at night](noise) earns the owner a [noise warning](warning), and each [warning](warning) ' +
      'makes [renewal of the slip lease](renewal) less likely. Omar’s uncle [named the boat Gull](name). Last week Omar [ran the engine past midnight](lastweek) ' +
      'while [fixing the bilge pump](pump), and he insists the [warning](warning) was unfair.',
    nodes: {
      slip: { label: 'Boat slip' },
      check: { label: 'Safety check' },
      registration: { label: 'Current hull registration' },
      flotation: { label: 'Flotation devices' },
      ring: { label: 'Life ring' },
      noise: { label: 'Engine running after 10 pm' },
      warning: { label: 'Noise warning' },
      renewal: { label: 'Slip lease renewal' },
      lastweek: { label: 'Last week’s late engine' },
      name: { label: 'Boat name', kind: 'distractor' },
      pump: { label: 'Fixing bilge pump', kind: 'distractor' },
    },
    relations: [
      { from: 'slip', to: 'check', type: 'requires' },
      { from: 'check', to: 'registration', type: 'requires' },
      { from: 'check', to: 'flotation', type: 'requires' },
      { from: 'ring', to: 'flotation', type: 'is_a', inferred: true },
      { from: 'noise', to: 'warning', type: 'produces' },
      { from: 'warning', to: 'renewal', type: 'decreases' },
      { from: 'lastweek', to: 'noise', type: 'is_a', inferred: true },
    ],
    lures: [
      { from: 'warning', to: 'slip', type: 'prevents' },
      { from: 'registration', to: 'check', type: 'is_a' },
    ],
  },

  'assess-food-truck': {
    markup:
      'Maria wants to sell tacos from a food truck downtown. The city issues a [vending permit](permit) only after the truck passes a [fire inspection](inspection), ' +
      'and inspectors will not inspect a truck until its [propane tank is certified](propane). The [inspection](inspection) also checks for [fire-safety equipment](safety); ' +
      'a [fire extinguisher](extinguisher) mounted by the door counts. [Parking within 15 feet of a hydrant](hydrant) earns the truck a [citation](citation), and each [citation](citation) ' +
      'makes [renewal of the permit](renewal) less likely. Maria’s cousin [painted the truck orange](paint). Last month Maria [left the truck by a hydrant](lastmonth) ' +
      'while [buying ice](ice), and she insists the [citation](citation) was unfair.',
    nodes: {
      permit: { label: 'Vending permit' },
      inspection: { label: 'Fire inspection' },
      propane: { label: 'Propane certification' },
      safety: { label: 'Fire-safety equipment' },
      extinguisher: { label: 'Fire extinguisher' },
      hydrant: { label: 'Parking near hydrant' },
      citation: { label: 'Citation' },
      renewal: { label: 'Permit renewal' },
      lastmonth: { label: 'Last month’s parking' },
      paint: { label: 'Orange paint', kind: 'distractor' },
      ice: { label: 'Buying ice', kind: 'distractor' },
    },
    relations: [
      { from: 'permit', to: 'inspection', type: 'requires' },
      { from: 'inspection', to: 'propane', type: 'requires' },
      { from: 'inspection', to: 'safety', type: 'requires' },
      { from: 'extinguisher', to: 'safety', type: 'is_a', inferred: true },
      { from: 'hydrant', to: 'citation', type: 'produces' },
      { from: 'citation', to: 'renewal', type: 'decreases' },
      { from: 'lastmonth', to: 'hydrant', type: 'is_a', inferred: true },
    ],
    lures: [
      { from: 'citation', to: 'permit', type: 'prevents' },
      { from: 'propane', to: 'inspection', type: 'is_a' },
    ],
  },
};
