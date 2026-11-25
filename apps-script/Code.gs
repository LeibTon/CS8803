/**
 * Data collection endpoint for the Semantic Network Builder study.
 *
 * Setup (once):
 *   1. Create a Google Sheet. Extensions → Apps Script. Replace the default code with this file.
 *   2. Deploy → New deployment → type "Web app".
 *        Execute as: Me          Who has access: Anyone
 *   3. Copy the web-app URL (ends in /exec) into docs/js/config.js → ENDPOINT.
 *   4. After editing this script: Deploy → Manage deployments → Edit → Version: New version.
 *      (The /exec URL stays the same.)
 *
 * Each POST is one finished scenario. Rows are de-duplicated on submission_id, so client retries are safe.
 */

var SHEET_NAME = 'responses';
var MAX_CELL = 49000; // Sheets allows 50,000 characters per cell

var COLUMNS = [
  'received_at', 'submission_id', 'session_id', 'pid', 'condition', 'app_version',
  'step_index', 'step_id', 'scenario_id', 'difficulty', 'domain', 'feedback_mode',
  'started_at', 'ended_at', 'duration_ms', 'checks',
  'recall', 'precision', 'f1', 'required_found', 'required_total', 'extra_relations',
  'lure_relations', 'distractor_nodes', 'extra_nodes', 'inferred_found', 'inferred_total',
  'node_count', 'edge_count',
  'reflection_inference', 'reflection_extraneous', 'confidence',
  'design_json', 'params_json', 'graph_json', 'events_json', 'user_agent'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    if (isDuplicate_(sheet, d.submissionId)) return json_({ ok: true, duplicate: true });

    var s = d.score || {};
    var r = d.reflection || {};
    var g = d.graph || { nodes: [], edges: [] };
    var row = [
      new Date().toISOString(), d.submissionId, d.sessionId, d.pid, d.condition, d.appVersion,
      d.stepIndex, d.stepId, d.scenarioId, d.difficulty, d.domain, d.feedbackMode,
      d.startedAt, d.endedAt, d.durationMs, d.checks,
      s.recall, s.precision, s.f1, s.requiredFound, s.requiredTotal, s.extraRelations,
      s.lureRelations, s.distractorNodes, s.extraNodes, s.inferredFound, s.inferredTotal,
      g.nodes.length, g.edges.length,
      r.inference || '', r.extraneous || '', r.confidence || '',
      cell_(d.design), cell_(d.params), cell_(g), cell_(d.events), d.userAgent
    ];
    sheet.appendRow(row.map(function (v) { return v === undefined || v === null ? '' : v; }));
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Visiting the /exec URL in a browser should show "ok" (handy to check the deployment). */
function doGet() {
  return ContentService.createTextOutput('ok');
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function isDuplicate_(sheet, id) {
  var n = sheet.getLastRow() - 1;
  if (n < 1 || !id) return false;
  var col = COLUMNS.indexOf('submission_id') + 1;
  return sheet.getRange(2, col, n, 1).createTextFinder(id).matchEntireCell(true).findNext() !== null;
}

function cell_(obj) {
  if (obj === undefined || obj === null) return '';
  var s = JSON.stringify(obj);
  return s.length > MAX_CELL ? s.slice(0, MAX_CELL) + '…[truncated]' : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
