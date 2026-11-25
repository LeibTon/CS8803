// Study configuration. This is the only file you should need to edit to run the study.

export const CONFIG = {
  STUDY_TITLE: 'Semantic Network Builder',
  APP_VERSION: '1.0.0',

  // Google Apps Script web-app URL (see apps-script/Code.gs). Leave empty for local testing:
  // records are then only kept in the browser and can be downloaded from the last screen.
  ENDPOINT: 'https://script.google.com/macros/s/AKfycbx9MqbaYXCK-BCBGj8Tssz202I87htTZjwoAXDq3OFPIBxNuTjT8nlDNAOuzKR6UbTp/exec',

  // Show a no-feedback pre-test before the learning activity (pre/post comparison).
  ENABLE_PRETEST: true,

  // Between-subjects conditions. `feedback` controls the easy/medium/hard scenarios.
  // Assignment order: ?cond= URL parameter → DEFAULT_CONDITION → hash of participant ID.
  CONDITIONS: {
    treatment: { feedback: true },
    control: { feedback: false },
  },
  DEFAULT_CONDITION: null,

  // Where to send participants when they finish (e.g. a Qualtrics post-survey).
  // ?pid=<participant id> is appended. Leave empty to show only the thank-you page.
  RETURN_URL: '',

  REQUIRE_CHECK_BEFORE_NEXT: true, // feedback scenarios: press Check at least once before moving on
  MAX_HINTS: 3,
  MIN_REFLECTION_CHARS: 15,

  // Text on the welcome screen.
  INTRO_HTML: `
    <p>This is a class project (CS 8803, Georgia Tech) on how people learn to turn written
    descriptions into diagrams of concepts and relations.</p>
    <p>You will read short scenarios and build a small network diagram for each one. It takes about
    <strong>10-15 minutes</strong>. We record the diagrams you build, how long each one takes, and your
    written answers.</p>`,
};

// Study flow. kind: 'tutorial' | 'task' | 'done'.
// feedback: 'always' (everyone), 'condition' (from CONDITIONS), 'none' (no score or hints).
// reflection: ask for written reasoning + confidence. pretest: dropped when ENABLE_PRETEST is false.
// scenario: one id, or a list to counterbalance. Steps sharing a `counterbalance` key use the same
// index for a participant, so the pre-test and transfer below always get different (parallel) forms:
// half the participants see marina → food truck, the other half food truck → marina.
const ASSESSMENT_FORMS = ['assess-marina', 'assess-food-truck'];

export const STEPS = [
  { id: 'tutorial', kind: 'tutorial' },
  { id: 'pretest',  kind: 'task', label: 'Pre-test', scenario: ASSESSMENT_FORMS,                 counterbalance: 'assessment', feedback: 'none', reflection: true, pretest: true },
  { id: 'practice', kind: 'task', label: 'Practice', scenario: 'practice-bread',      feedback: 'always' },
  { id: 'easy',     kind: 'task', label: 'Easy',     scenario: 'easy-lab-report',     feedback: 'condition' },
  { id: 'medium',   kind: 'task', label: 'Medium',   scenario: 'medium-wolves',       feedback: 'condition' },
  { id: 'hard',     kind: 'task', label: 'Hard',     scenario: 'hard-flour-contract', feedback: 'condition' },
  { id: 'transfer', kind: 'task', label: 'Transfer', scenario: [...ASSESSMENT_FORMS].reverse(), counterbalance: 'assessment', feedback: 'none', reflection: true },
  { id: 'done',     kind: 'done' },
];
