// Shared helpers for the offline scripts: scenario lookup (with answer keys merged in) and CSV I/O.

import { parseMarkup } from '../docs/js/markup.js';
import { SCENARIOS } from '../docs/js/data/scenarios.js';
import { ASSESSMENTS } from '../docs/js/data/assessments.js';
import { KEYS } from './answer-keys.mjs';

/** Every scenario with full answer data. Throws if an answer key doesn't match its public text. */
export function loadScenarios() {
  const all = { ...SCENARIOS };
  for (const [id, pub] of Object.entries(ASSESSMENTS)) {
    const key = KEYS[id];
    if (!key) throw new Error(`No answer key for assessment "${id}" in analysis/answer-keys.mjs`);
    const { plain } = parseMarkup(key.markup);
    if (plain !== pub.text) {
      let i = 0;
      while (plain[i] === pub.text[i]) i++;
      throw new Error(`Answer key text for "${id}" differs from docs/js/data/assessments.js at char ${i}:\n` +
        `  key:    …${plain.slice(Math.max(0, i - 20), i + 30)}…\n  public: …${pub.text.slice(Math.max(0, i - 20), i + 30)}…`);
    }
    all[id] = { ...pub, ...key };
  }
  return all;
}

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.length > 1 || r[0]);
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

export function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}
