// Participant session: ID, condition, current step and per-step work, persisted in localStorage
// so a refresh or crash resumes where the participant left off.

import { CONFIG } from './config.js';

const KEY = 'snb-session-v1';

const randomId = (n = 8) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

export const newParticipantId = () => `P-${randomId(6)}`;

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Deterministic choice among n variants for this participant (used for counterbalancing scenarios). */
export const pickVariant = (pid, key, n) => hash(`${pid}:${key}`) % n;

function pickCondition(pid, requested) {
  const names = Object.keys(CONFIG.CONDITIONS);
  if (requested && names.includes(requested)) return requested;
  if (CONFIG.DEFAULT_CONDITION && names.includes(CONFIG.DEFAULT_CONDITION)) return CONFIG.DEFAULT_CONDITION;
  return names[hash(pid) % names.length];
}

/** Reads URL params (?pid, ?cond, ?reset=1) and any saved session that belongs to this participant. */
export function loadSession() {
  const params = new URLSearchParams(location.search);
  const urlPid = params.get('pid')?.trim() || null;
  const urlCond = params.get('cond')?.trim() || null;
  if (params.has('reset')) {
    localStorage.removeItem(KEY);
    params.delete('reset');
    const qs = params.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}`);
  }
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* corrupted: start fresh */ }
  const session = saved && (!urlPid || saved.pid === urlPid) ? saved : null;
  return { session, urlPid, urlCond };
}

export function createSession(pid, requestedCondition) {
  return {
    version: 1,
    sessionId: `S-${randomId(10)}`,
    pid,
    condition: pickCondition(pid, requestedCondition),
    createdAt: new Date().toISOString(),
    stepIndex: 0,
    steps: {},
  };
}

export function saveSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Could not save session', err);
  }
}
