# Semantic Network Builder: study app

This is a static web app for the AIE transfer-learning study. Participants read scenarios and
build semantic networks from them. The app gives feedback on practice scenarios and none on the
pre-test and transfer assessments. Each finished scenario is sent to a Google Sheet.
Plain HTML, CSS and JS with ES modules. No build step and no dependencies.

```
docs/                     ← the website (GitHub Pages serves this folder)
  index.html, css/styles.css
  js/
    config.js             ← EDIT THIS: endpoint URL, conditions, study flow (STEPS), welcome text
    main.js               app flow: welcome → tutorial → tasks → done
    session.js            participant ID, condition assignment, resume after refresh
    logger.js             upload queue with retry (localStorage) + local archive
    graph.js              learner graph model (emits change events)
    markup.js             [phrase](nodeId) scenario markup, selection → node matching
    scoring.js            comparison with the reference graph + hints   (shared with analysis/)
    scenarioParams.js     scenario parameters + level targets (Table 2) (shared with analysis/)
    relations.js          the six relation types
    data/scenarios.js     scenarios WITH answers (tutorial, practice, easy, medium, hard + alternates)
    data/assessments.js   pre-test + transfer text only (no answers in the browser)
    ui/                   canvas, scenario panel, palette, feedback panel, progress, screens, task
apps-script/Code.gs       Google Apps Script endpoint → Google Sheet
analysis/
  answer-keys.mjs         answer keys for pre-test + transfer (not served by the site)
  score.mjs               re-score all responses offline → tidy CSV
  params.mjs              print every scenario's parameters + warnings
  scenario-prompt.md      prompt template for generating new scenarios with AI
```

## 1. Run locally

Any static server works, because ES modules don't load over `file://`.

```bash
npm run serve                      # http://localhost:8080  (or: python -m http.server -d docs 8080)
```

Useful URLs:
- `/?pid=P123&cond=treatment`: set the participant ID and condition (`treatment` or `control`)
- `/?reset=1`: clear saved progress in this browser (for testing)

With `ENDPOINT` empty, responses stay in the browser. The last screen offers **Download my data**.

## 2. Set up data collection (Google Sheet)

1. Create a Google Sheet, then open **Extensions → Apps Script** and paste in `apps-script/Code.gs`.
2. Go to **Deploy → New deployment → Web app**. Set *Execute as: Me* and *Who has access: Anyone*.
3. Copy the `/exec` URL into `ENDPOINT` in `docs/js/config.js`.
4. Check it: open the URL in a browser and it should say `ok`. Then do one run-through; a `responses` tab appears with one row per scenario.

Each row holds the IDs, condition, scenario, timing, number of checks, score fields, the
reflection answers, and JSON columns: the full graph, every edit event, and the scenario
design/parameters. Client retries are de-duplicated on `submission_id`.

## 3. Deploy to GitHub Pages

Push the repo, then go to **Settings → Pages → Deploy from a branch → `main` / `/docs`**.
The site appears at `https://<user>.github.io/<repo>/`.

Answer keys: only `docs/` is served, so the pre-test and transfer answers in `analysis/` are not
part of the site. If the repo is public they are still readable on github.com, though. Make the
repo private (Pages on private repos is free with the GitHub Student Pack), or keep
`answer-keys.mjs` out of git.

## 4. Study design knobs (`docs/js/config.js`)

| Setting | What it does |
|---|---|
| `CONDITIONS` | `treatment` gets feedback on easy/medium/hard; `control` doesn't. Practice always has feedback. |
| `DEFAULT_CONDITION` | Force one condition. Otherwise `?cond=` is used, or a hash of the participant ID. |
| `ENABLE_PRETEST` | Turn the no-feedback pre-test on or off. |
| `STEPS` | Order of screens. `scenario` can be a list, e.g. `['medium-wolves', 'medium-coral-reef']`, to counterbalance (assigned per participant). |
| `RETURN_URL` | Send participants on to a Qualtrics post-survey, with `?pid=` appended. |
| `REQUIRE_CHECK_BEFORE_NEXT`, `MAX_HINTS`, `MIN_REFLECTION_CHARS` | Feedback and reflection behaviour. |

**Qualtrics option:** run any demographics questions in Qualtrics, then link to
`…github.io/<repo>/?pid=${e://Field/ResponseID}`. Set `RETURN_URL` back to a Qualtrics
post-survey, and the participant ID joins the two datasets.

## 5. Scenarios and their parameters

Each scenario declares:
- **design** (written by hand): `level`, `domainFamiliarity` (everyday, stem or unfamiliar),
  `explicitness`, `extraneousDetail` and `purpose`
- **generation**: the model, prompt version and date, and `validatedBy` (the instructor who checked
  the reference graph)

The measured parameters are **computed** from the content, so they can't drift: words, sentences,
nodes, required relations, relation types used, inferred relations, distractor phrases and lure
relations. `LEVEL_TARGETS` in `scenarioParams.js` defines the intended range for each level.

```bash
npm run params           # table of every scenario + warnings (out of range, untagged nodes, unvalidated keys)
npm run params -- --csv  # same as CSV, for the report
```

Current set:

| id | level | domain | words | nodes | relations | types | inferred | distractors | lures |
|---|---|---|---|---|---|---|---|---|---|
| practice-bread | practice | Baking | 28 | 6 | 4 | 4 | 0 | 1 | 0 |
| easy-lab-report | easy | Lab report | 35 | 6 | 5 | 3 | 0 | 1 | 0 |
| easy-coffee *(alt)* | easy | Cooking | 36 | 5 | 5 | 4 | 0 | 1 | 0 |
| medium-wolves | medium | Ecology | 51 | 7 | 6 | 4 | 2 | 1 | 1 |
| medium-coral-reef *(alt)* | medium | Marine biology | 64 | 7 | 6 | 5 | 2 | 1 | 1 |
| hard-flour-contract | hard | Contract law | 89 | 8 | 7 | 3 | 3 | 2 | 3 |
| hard-insurance-claim *(alt)* | hard | Insurance | 93 | 8 | 7 | 3 | 2 | 2 | 2 |
| assess-food-truck | assessment | City regulation | 99 | 9 | 7 | 4 | 2 | 2 | 2 |
| assess-marina | assessment | Harbor regulation | 102 | 9 | 7 | 4 | 2 | 2 | 2 |

**Pre-test and transfer are parallel forms.** The two assessment scenarios have the same graph
structure (node for node; see the comment in `analysis/answer-keys.mjs`), length, inferred
relations, distractors and lures, and both are in unfamiliar domains. `config.js` counterbalances them:
each participant gets one as the pre-test and the other as transfer, split about 50/50 by participant
ID. A pre→post gain therefore can't come from one form being easier. In analysis, include
`scenario_id` (the form) as a covariate or check that form order has no effect.

### Adding a scenario

1. Generate it with `analysis/scenario-prompt.md`. The prompt outputs the exact object format.
2. Feedback scenarios go in `docs/js/data/scenarios.js`. For a no-feedback scenario, put the plain
   text in `assessments.js` and the tagged markup plus answers in `analysis/answer-keys.mjs`.
3. Tag **every** mention of a concept, `[like this](nodeId)`. The learner selects text, and the
   tag it overlaps most decides which node it is. Untagged text becomes an extra node.
4. Run `npm run params` and `npm run verify-keys`. Then fill in `generation.validatedBy` once an
   instructor has checked the graph.

## 6. Scoring and analysis

Practice scenarios are scored live in the browser. Every scenario, including the pre-test and
transfer, is re-scored offline:

```bash
# File → Download → CSV from the Sheet, then:
node analysis/score.mjs responses.csv > scored.csv
# or from participants' "Download my data" files:
node analysis/score.mjs P-ABC123-S-….json … > scored.csv
```

Output is one row per participant × scenario. It has the scenario parameters (`p_*`) and
`recall` (share of required relations found), `precision`, `f1`, `inferred_found/total`,
`extra_relations`, `lure_relations`, `distractor_nodes`, `node_recall`, time, checks, confidence
and the reflection text. Nodes are re-matched from their character offsets, so fixing a tag in a
key and re-running re-scores old data consistently.

Edge correctness compares source, target, type and direction. The reflection criteria
(justification for inferences, reasoning about extraneous detail, confidence) come from the
reflection columns. Code the first two by hand; confidence is the 1–5 rating.

## Interaction reference (for participants)

- Select text → **+ Add node**. Selecting an already-used concept flashes the existing node.
- Drag from a node's **●** handle to another node → pick a relation type.
- Click a relation, then a palette type → change its type. **Delete** removes the selection.
- Double-click a node → rename it. Drag nodes to rearrange.
- Progress saves on every edit, so a refresh resumes where the participant left off.
