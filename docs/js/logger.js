// Submission queue. Every finished step becomes one record that is POSTed to the Apps Script
// endpoint. Records wait in localStorage until the request goes through, so a dropped connection
// loses nothing. A copy of each record is archived locally for the "download my data" fallback.

import { CONFIG } from './config.js';

const OUTBOX = 'snb-outbox-v1';
const ARCHIVE = 'snb-archive-v1';

const read = (k) => {
  try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let flushing = null;

export function queueRecord(record) {
  write(OUTBOX, [...read(OUTBOX), record]);
  write(ARCHIVE, [...read(ARCHIVE), record]);
  return flush();
}

export const pendingCount = () => read(OUTBOX).length;

/** Sends queued records. Resolves to the number still pending. Concurrent calls share one run. */
export function flush() {
  if (!flushing) flushing = sendAll().finally(() => { flushing = null; });
  return flushing;
}

async function sendAll() {
  if (!CONFIG.ENDPOINT) {
    if (pendingCount()) console.info('[study] No ENDPOINT set; records kept locally only.', read(OUTBOX));
    write(OUTBOX, []);
    return 0;
  }
  for (const rec of read(OUTBOX)) {
    try {
      // text/plain + no-cors avoids a CORS preflight, which Apps Script cannot answer.
      await fetch(CONFIG.ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(rec),
      });
      write(OUTBOX, read(OUTBOX).filter((r) => r.submissionId !== rec.submissionId));
    } catch (err) {
      console.warn('[study] Upload failed, will retry', err);
      break;
    }
  }
  return pendingCount();
}

export const archivedRecords = (sessionId) => read(ARCHIVE).filter((r) => r.sessionId === sessionId);

export function downloadJSON(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
