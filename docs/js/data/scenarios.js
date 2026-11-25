// Scenarios with feedback (their reference graphs ship to the browser so they can be checked live).
// Assessment scenarios (pre-test, transfer) are in assessments.js WITHOUT answers. Their keys live in
// analysis/answer-keys.mjs, which the site does not serve.
//
// Fields
//   markup      text with [phrase](nodeId) tags (see js/markup.js). Tag every mention a learner might select.
//   difficulty  'example' | 'practice' | 'easy' | 'medium' | 'hard'  (keys of LEVEL_TARGETS in scenarioParams.js)
//   design      hand-declared parameters (see scenarioParams.js). Measured parameters are computed, not typed.
//   generation  provenance of AI-generated text + who validated the answer key
//   nodes       nodeId → { label, kind?: 'reference' (default) | 'distractor' | 'lure', note? }
//               note: hint shown when a learner adds this non-reference node
//   relations   required edges { from, to, type, inferred?, hint? }. hint points at a sentence, never the answer
//   lures       tempting but wrong edges { from, to, type, note? }
//   layout      (example only) nodeId → [x, y] for the worked example
//
// Each level has a primary scenario (used in config.js STEPS) and an alternate. Use the alternate for
// counterbalancing (give STEPS a list of ids) or as a backup if piloting shows a problem.

const gen = (extra = {}) => ({
  source: 'generative-ai',
  model: 'TODO: model name/version used',
  promptVersion: 'analysis/scenario-prompt.md@v1',
  generatedOn: null,
  validatedBy: null, // instructor who validated the reference graph
  ...extra,
});

export const SCENARIOS = {
  // ------------------------------------------------------------------ worked example (tutorial)
  'tutorial-garden': {
    id: 'tutorial-garden',
    title: 'A tomato garden',
    difficulty: 'example',
    domain: 'Gardening',
    design: { level: 0, domainFamiliarity: 'everyday', explicitness: 'explicit', extraneousDetail: 'low', purpose: 'example' },
    generation: gen({ source: 'hand-written' }),
    markup:
      '[Tomato plants](plants) grow [tomatoes](tomatoes), but a plant only sets fruit once [bees](bees) have visited its flowers. ' +
      'More [compost](compost) means a bigger [harvest](harvest), while more [aphids](aphids) means a smaller one. ' +
      '[Fine netting](netting) keeps [aphids](aphids) off the plants. [Cherry tomatoes](cherry) are one kind of [tomato](tomatoes). ' +
      'The garden gate is painted green.',
    nodes: {
      plants: { label: 'Tomato plants' },
      tomatoes: { label: 'Tomatoes' },
      bees: { label: 'Bees' },
      compost: { label: 'Compost' },
      harvest: { label: 'Harvest' },
      aphids: { label: 'Aphids' },
      netting: { label: 'Fine netting' },
      cherry: { label: 'Cherry tomatoes' },
    },
    relations: [
      { from: 'plants', to: 'tomatoes', type: 'produces', explain: 'Plants grow (create) tomatoes.' },
      { from: 'tomatoes', to: 'bees', type: 'requires', explain: 'No fruit unless bees have visited first.' },
      { from: 'compost', to: 'harvest', type: 'increases', explain: '“More compost means a bigger harvest.”' },
      { from: 'aphids', to: 'harvest', type: 'decreases', explain: '“More aphids means a smaller one” (harvest).' },
      { from: 'netting', to: 'aphids', type: 'prevents', explain: 'Netting stops aphids getting onto the plants.' },
      { from: 'cherry', to: 'tomatoes', type: 'is_a', explain: 'Cherry tomatoes are one kind of tomato.' },
    ],
    lures: [],
    layout: {
      plants: [90, 50], tomatoes: [300, 50], bees: [520, 50], cherry: [300, 150],
      compost: [90, 250], harvest: [300, 250], aphids: [520, 250], netting: [520, 150],
    },
  },

  // ------------------------------------------------------------------ practice
  'practice-bread': {
    id: 'practice-bread',
    title: 'Saturday bread',
    difficulty: 'practice',
    domain: 'Baking',
    design: { level: 1, domainFamiliarity: 'everyday', explicitness: 'explicit', extraneousDetail: 'low', purpose: 'practice' },
    generation: gen(),
    markup:
      '[Sam](sam) bakes [bread](bread) every Saturday. [Bread](bread) cannot rise without [yeast](yeast). ' +
      'A [hotter oven](oven) gives a [darker crust](crust). [Sourdough](sourdough) is a type of [bread](bread). ' +
      '[Sam](sam)’s kitchen has [blue tiles](tiles).',
    nodes: {
      sam: { label: 'Sam' },
      bread: { label: 'Bread' },
      yeast: { label: 'Yeast' },
      oven: { label: 'Oven heat' },
      crust: { label: 'Crust darkness' },
      sourdough: { label: 'Sourdough' },
      tiles: { label: 'Blue tiles', kind: 'distractor', note: 'The kitchen tiles don’t affect the bread. That sentence is extra detail.' },
    },
    relations: [
      { from: 'sam', to: 'bread', type: 'produces', hint: 'Reread the first sentence.' },
      { from: 'bread', to: 'yeast', type: 'requires', hint: 'What can bread not do without?' },
      { from: 'oven', to: 'crust', type: 'increases', hint: 'Reread the sentence about the oven.' },
      { from: 'sourdough', to: 'bread', type: 'is_a', hint: 'Reread the sentence about sourdough.' },
    ],
    lures: [],
  },

  // ------------------------------------------------------------------ easy
  'easy-lab-report': {
    id: 'easy-lab-report',
    title: 'Writing a lab report',
    difficulty: 'easy',
    domain: 'Lab report',
    design: { level: 2, domainFamiliarity: 'everyday', explicitness: 'explicit', extraneousDetail: 'low', purpose: 'learning' },
    generation: gen(),
    markup:
      '[Priya](priya) writes a [lab report](report). Her partner, [Tom](tom), must [sign off](signoff) on it before it can be [graded](grade), ' +
      'and a [report handed in late](late) is not [graded](grade) at all. [Priya](priya) usually studies in the [library](library).',
    nodes: {
      priya: { label: 'Priya' },
      report: { label: 'Report' },
      tom: { label: 'Tom' },
      signoff: { label: 'Sign-off' },
      grade: { label: 'Grade' },
      late: { label: 'Late hand-in' },
      library: { label: 'Library', kind: 'distractor', note: 'Where Priya studies doesn’t change what happens to the report.' },
    },
    relations: [
      { from: 'priya', to: 'report', type: 'produces', hint: 'Reread the first sentence.' },
      { from: 'tom', to: 'signoff', type: 'produces', hint: 'Who carries out the sign-off?' },
      { from: 'signoff', to: 'report', type: 'requires', hint: 'What does Tom sign off on?' },
      { from: 'grade', to: 'signoff', type: 'requires', hint: 'What has to happen before the report can be graded?' },
      { from: 'late', to: 'grade', type: 'prevents', hint: 'Reread the part about reports handed in late.' },
    ],
    lures: [],
  },

  'easy-coffee': {
    id: 'easy-coffee',
    title: 'Morning coffee',
    difficulty: 'easy',
    domain: 'Cooking',
    design: { level: 2, domainFamiliarity: 'everyday', explicitness: 'explicit', extraneousDetail: 'low', purpose: 'learning' },
    generation: gen(),
    markup:
      '[Leo](leo) grinds [beans](beans) and brews [coffee](coffee) each morning. [Coffee](coffee) cannot be brewed without ground [beans](beans), ' +
      'and a [broken grinder](grinder) stops any grinding. [Espresso](espresso) is one kind of [coffee](coffee). ' +
      '[Leo](leo)’s mug has a [cartoon cat](cat) on it.',
    nodes: {
      leo: { label: 'Leo' },
      beans: { label: 'Ground beans' },
      coffee: { label: 'Coffee' },
      grinder: { label: 'Broken grinder' },
      espresso: { label: 'Espresso' },
      cat: { label: 'Cartoon cat', kind: 'distractor', note: 'The picture on the mug doesn’t affect the coffee.' },
    },
    relations: [
      { from: 'leo', to: 'beans', type: 'produces', hint: 'Reread the first sentence.' },
      { from: 'leo', to: 'coffee', type: 'produces', hint: 'Reread the first sentence.' },
      { from: 'coffee', to: 'beans', type: 'requires', hint: 'What can coffee not be brewed without?' },
      { from: 'grinder', to: 'beans', type: 'prevents', hint: 'Reread the part about the grinder.' },
      { from: 'espresso', to: 'coffee', type: 'is_a', hint: 'Reread the sentence about espresso.' },
    ],
    lures: [],
  },

  // ------------------------------------------------------------------ medium
  'medium-wolves': {
    id: 'medium-wolves',
    title: 'Wolves return to a valley',
    difficulty: 'medium',
    domain: 'Ecology',
    design: { level: 3, domainFamiliarity: 'stem', explicitness: 'mixed', extraneousDetail: 'medium', purpose: 'learning' },
    generation: gen(),
    markup:
      'After [wolves](wolves) returned to the valley, [elk stopped grazing on the creek banks](grazing), where [wolves](wolves) could ambush them. ' +
      '[Willows](willows) soon grew back along the creek. [Beavers](beavers), which build their [dams](dams) from [willow wood](willows), moved back, ' +
      'and their [dams](dams) formed [ponds](ponds) where [trout](trout) now breed. [Wolf-watching tours](tours) bring 40,000 visitors a year.',
    nodes: {
      wolves: { label: 'Wolves' },
      grazing: { label: 'Elk grazing on banks' },
      willows: { label: 'Willows' },
      beavers: { label: 'Beavers' },
      dams: { label: 'Dams' },
      ponds: { label: 'Ponds' },
      trout: { label: 'Trout' },
      tours: { label: 'Tours', kind: 'distractor', note: 'Tours are not part of the ecosystem described.' },
    },
    relations: [
      { from: 'wolves', to: 'grazing', type: 'decreases', inferred: true, hint: 'Why did the elk stop grazing on the banks?' },
      { from: 'grazing', to: 'willows', type: 'decreases', inferred: true, hint: 'Why could the willows grow back?' },
      { from: 'dams', to: 'willows', type: 'requires', hint: 'What are the dams built from?' },
      { from: 'beavers', to: 'dams', type: 'produces', hint: 'Reread the sentence about the beavers.' },
      { from: 'dams', to: 'ponds', type: 'produces', hint: 'Reread the sentence about the ponds.' },
      { from: 'ponds', to: 'trout', type: 'increases', hint: 'Reread the sentence about the ponds.' },
    ],
    lures: [
      { from: 'wolves', to: 'tours', type: 'increases', note: 'Wolves → Tours: the tours are not part of the ecosystem described.' },
    ],
  },

  'medium-coral-reef': {
    id: 'medium-coral-reef',
    title: 'A warming reef',
    difficulty: 'medium',
    domain: 'Marine biology',
    design: { level: 3, domainFamiliarity: 'stem', explicitness: 'mixed', extraneousDetail: 'medium', purpose: 'learning' },
    generation: gen(),
    markup:
      'Warmer [ocean water](temp) causes more [coral bleaching](bleaching), in which [corals](corals) expel the algae that feed them; ' +
      '[bleached corals](bleaching) often die. [Staghorn coral](staghorn) is one of the reef-building [corals](corals) hit hardest. ' +
      'Living [corals](corals) build the [reef crevices](crevices) that [parrotfish](parrotfish) need to hide from predators at night. ' +
      'Dead reef is soon covered in [seaweed](seaweed). A [dive shop](diveshop) on the island has cut its trips in half.',
    nodes: {
      temp: { label: 'Water temperature' },
      bleaching: { label: 'Coral bleaching' },
      corals: { label: 'Living corals' },
      staghorn: { label: 'Staghorn coral' },
      crevices: { label: 'Reef crevices' },
      parrotfish: { label: 'Parrotfish' },
      seaweed: { label: 'Seaweed' },
      diveshop: { label: 'Dive shop', kind: 'distractor', note: 'The dive shop is not part of the reef ecosystem described.' },
    },
    relations: [
      { from: 'temp', to: 'bleaching', type: 'increases', hint: 'Reread the first sentence.' },
      { from: 'bleaching', to: 'corals', type: 'decreases', inferred: true, hint: 'What happens to bleached corals?' },
      { from: 'staghorn', to: 'corals', type: 'is_a', hint: 'Reread the sentence about staghorn coral.' },
      { from: 'corals', to: 'crevices', type: 'produces', hint: 'What do living corals build?' },
      { from: 'parrotfish', to: 'crevices', type: 'requires', hint: 'Reread the sentence about parrotfish.' },
      { from: 'bleaching', to: 'seaweed', type: 'increases', inferred: true, hint: 'Where does the seaweed grow, and how did that reef die?' },
    ],
    lures: [
      { from: 'bleaching', to: 'diveshop', type: 'decreases', note: 'Coral bleaching → Dive shop: the dive shop is not part of the ecosystem described.' },
    ],
  },

  // ------------------------------------------------------------------ hard
  'hard-flour-contract': {
    id: 'hard-flour-contract',
    title: 'A flour supply contract',
    difficulty: 'hard',
    domain: 'Contract law',
    design: { level: 4, domainFamiliarity: 'unfamiliar', explicitness: 'implicit', extraneousDetail: 'high', purpose: 'learning' },
    generation: gen(),
    markup:
      'A bakery’s supply agreement with Corrigan Mills says a [missed delivery](missed) is a [breach](breach) unless an ' +
      '[event beyond Corrigan’s control](beyond), such as a [flood](flood), causes it. The bakery may [end the agreement](end) for a [breach](breach) ' +
      'only after [written notice](notice), and only if Corrigan does not [cure the breach within 10 days](cure). [Email](email) counts as ' +
      '[written notice](notice). In June, [Corrigan missed a delivery](june) because it [double-booked its truck](truck). The baker ' +
      '[phoned to complain](phone), then sent an [email notice](email). Corrigan [delivered 13 days after the email](late13). ' +
      'The bakery [opened in 2024](opened).',
    nodes: {
      missed: { label: 'Missed delivery' },
      breach: { label: 'Breach' },
      beyond: { label: 'Event beyond control' },
      end: { label: 'Ending the agreement' },
      notice: { label: 'Written notice' },
      cure: { label: 'Cure within 10 days' },
      email: { label: 'Email notice' },
      june: { label: 'June missed delivery' },
      flood: { label: 'Flood', kind: 'distractor', note: 'The flood is only an example in the agreement. Nothing in this case was caused by one.' },
      opened: { label: 'Opened in 2024', kind: 'distractor', note: 'When the bakery opened has nothing to do with the agreement.' },
      truck: { label: 'Double-booked truck', kind: 'lure', note: 'Was the double-booking really beyond Corrigan’s control?' },
      phone: { label: 'Phone complaint', kind: 'lure', note: 'Does a phone call meet the agreement’s notice requirement?' },
      late13: { label: 'Delivered after 13 days', kind: 'lure', note: 'Compare 13 days with the cure period in the agreement.' },
    },
    relations: [
      { from: 'missed', to: 'breach', type: 'is_a', hint: 'Reread the first sentence: what does the agreement call a missed delivery?' },
      { from: 'beyond', to: 'breach', type: 'prevents', hint: 'Reread the “unless …” part of the first sentence.' },
      { from: 'end', to: 'breach', type: 'requires', inferred: true, hint: 'What must have happened before the bakery can end the agreement?' },
      { from: 'end', to: 'notice', type: 'requires', hint: 'Reread the sentence about ending the agreement.' },
      { from: 'cure', to: 'end', type: 'prevents', inferred: true, hint: 'What happens to the right to end the agreement if Corrigan fixes things in time?' },
      { from: 'june', to: 'missed', type: 'is_a', inferred: true, hint: 'Link what happened in June to what the agreement says.' },
      { from: 'email', to: 'notice', type: 'is_a', hint: 'Reread the sentence about email.' },
    ],
    lures: [
      { from: 'truck', to: 'beyond', type: 'is_a', note: 'Double-booked truck → Event beyond control: double-booking was Corrigan’s own mistake.' },
      { from: 'phone', to: 'notice', type: 'is_a', note: 'Phone complaint → Written notice: a phone call is not written.' },
      { from: 'late13', to: 'cure', type: 'is_a', note: 'Delivered after 13 days → Cure: 13 days is outside the 10-day cure period.' },
    ],
  },

  'hard-insurance-claim': {
    id: 'hard-insurance-claim',
    title: 'A renter’s insurance claim',
    difficulty: 'hard',
    domain: 'Insurance',
    design: { level: 4, domainFamiliarity: 'unfamiliar', explicitness: 'implicit', extraneousDetail: 'high', purpose: 'learning' },
    generation: gen(),
    markup:
      'Dana’s renter’s policy says [sudden water damage](sudden) is a [covered loss](covered), but [damage from a slow leak](slowleak) is excluded. ' +
      'The insurer will [pay a claim](payout) only for a [covered loss](covered), only after an [adjuster inspects the damage](inspection), ' +
      'and only if the [loss is reported within 30 days](report). A [burst pipe](burst) counts as [sudden water damage](sudden). ' +
      'In March, [a pipe burst under Dana’s sink](march) while she was [visiting her sister](sister). She [posted photos online](photos) ' +
      'the next day and [reported the loss](reported) to the insurer 41 days later. Dana has [had the policy since 2021](since).',
    nodes: {
      sudden: { label: 'Sudden water damage' },
      covered: { label: 'Covered loss' },
      slowleak: { label: 'Slow-leak damage' },
      payout: { label: 'Claim payment' },
      inspection: { label: 'Adjuster inspection' },
      report: { label: 'Reported within 30 days' },
      burst: { label: 'Burst pipe' },
      march: { label: 'March pipe burst' },
      sister: { label: 'Visiting her sister', kind: 'distractor', note: 'Where Dana was has nothing to do with the policy.' },
      since: { label: 'Policy since 2021', kind: 'distractor', note: 'How long Dana has had the policy doesn’t affect this claim.' },
      photos: { label: 'Photos online', kind: 'lure', note: 'Is posting photos online the same as reporting to the insurer?' },
      reported: { label: 'Reported after 41 days', kind: 'lure', note: 'Compare 41 days with the reporting window in the policy.' },
    },
    relations: [
      { from: 'sudden', to: 'covered', type: 'is_a', hint: 'Reread the first sentence.' },
      { from: 'slowleak', to: 'covered', type: 'prevents', inferred: true, hint: 'What does “excluded” mean for slow-leak damage?' },
      { from: 'payout', to: 'covered', type: 'requires', hint: 'Reread the sentence about when the insurer pays.' },
      { from: 'payout', to: 'inspection', type: 'requires', hint: 'Reread the sentence about when the insurer pays.' },
      { from: 'payout', to: 'report', type: 'requires', hint: 'Reread the sentence about when the insurer pays.' },
      { from: 'burst', to: 'sudden', type: 'is_a', hint: 'Reread the sentence about burst pipes.' },
      { from: 'march', to: 'burst', type: 'is_a', inferred: true, hint: 'Link what happened in March to what the policy says.' },
    ],
    lures: [
      { from: 'reported', to: 'report', type: 'is_a', note: 'Reported after 41 days → Reported within 30 days: 41 days is outside the window.' },
      { from: 'photos', to: 'report', type: 'is_a', note: 'Photos online → Report: posting online is not reporting to the insurer.' },
    ],
  },
};
