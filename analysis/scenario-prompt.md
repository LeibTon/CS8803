# Scenario generation prompt (v1)

We generate scenarios offline with a generative AI model. An instructor then validates the
reference graph, and the scenario is pasted into `docs/js/data/scenarios.js`, or into
`assessments.js` plus `answer-keys.mjs` for no-feedback scenarios. Record the model and date in
the scenario's `generation` field, and set `validatedBy` once an instructor has checked the graph.
Then run `npm run params` to confirm it falls inside the level targets.

Fill in the `{…}` slots. The target numbers come from `LEVEL_TARGETS` in
`docs/js/scenarioParams.js`.

---

You are writing a short scenario for a study on building semantic networks from text.

**Relation vocabulary.** Use only these relation types (A → B):
- produces: A creates, carries out or brings about B
- requires: A cannot happen or exist unless B has
- prevents: A stops B from happening
- increases: more of A leads to more of B
- decreases: more of A leads to less of B
- is_a: A is an instance or a kind of B

**Write a scenario with these parameters:**
- Domain: {domain}. Learners' familiarity with it: {everyday | stem | unfamiliar}.
- Length: {words_min}–{words_max} words, in plain prose with no bullet points.
- Reference network: {nodes} concept nodes and {relations} required relations, using at least {types} different relation types.
- {inferred} of the required relations must be **implied, not stated** (the reader has to infer them).
- {distractors} distractor phrase(s): true but irrelevant details that belong to no relation.
- {lures} lure relation(s): connections a careless reader might draw but the text does not support (for example a near-miss on a deadline, or something that sounds like the right category but isn't).

**Output format.** Output a single JavaScript object literal, exactly in this shape:

```js
{
  id: '{level}-{short-slug}',
  title: '…',
  difficulty: '{practice|easy|medium|hard|transfer}',
  domain: '{domain}',
  design: { level: N, domainFamiliarity: '…', explicitness: 'explicit|mixed|implicit', extraneousDetail: 'low|medium|high', purpose: 'learning' },
  markup: 'Prose where every mention of a concept is tagged as [surface text](nodeId). Tag repeated mentions too.',
  nodes: {
    nodeId: { label: 'Short label' },
    distractorId: { label: '…', kind: 'distractor', note: 'Why it is irrelevant (shown as a hint).' },
    lureNodeId: { label: '…', kind: 'lure', note: 'A question that makes the learner reconsider, without giving the answer.' },
  },
  relations: [
    { from: 'nodeId', to: 'nodeId', type: 'produces', inferred: false, hint: 'Points to a sentence, e.g. "Reread the sentence about X." Never states the answer.' },
  ],
  lures: [
    { from: 'nodeId', to: 'nodeId', type: 'is_a', note: 'A → B: why this is wrong.' },
  ],
}
```

Rules:
- Each tag must wrap the exact words a learner would select. Do not put tags inside other tags.
- Every node must be tagged at least once, and every tag must refer to a node.
- Relations go in the direction defined above. For example, "Grade requires Sign-off", not the reverse.
- Hints must not reveal the relation type or the missing node.
