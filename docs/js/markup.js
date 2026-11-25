// Scenario text markup + selection helpers. Pure functions (no DOM), shared with analysis/.
//
// Markup format: plain prose where concept phrases are written as [surface text](nodeId).
//   "After [wolves](wolves) returned, [elk stopped grazing](grazing) ..."
// Several phrases may point at the same nodeId. Untagged text can still be selected by
// learners; it becomes a "free" node that does not match the reference.

const TAG = /\[([^\]]+)\]\(([\w-]+)\)/g;

/** Strip markup. Returns the plain text the learner sees and the character spans of each tagged phrase. */
export function parseMarkup(src = '') {
  let plain = '';
  let last = 0;
  const spans = [];
  for (const m of src.matchAll(TAG)) {
    plain += src.slice(last, m.index);
    const start = plain.length;
    plain += m[1];
    spans.push({ start, end: plain.length, nodeId: m[2] });
    last = m.index + m[0].length;
  }
  plain += src.slice(last);
  return { plain, spans };
}

/** Map a selected character range to the tagged phrase it overlaps most (or null). */
export function matchSpan(spans, start, end) {
  let best = null;
  let bestOverlap = 0;
  for (const s of spans) {
    const overlap = Math.min(end, s.end) - Math.max(start, s.start);
    if (overlap > bestOverlap) { bestOverlap = overlap; best = s; }
  }
  return best ? best.nodeId : null;
}

const WORD = /[\w'’-]/;
const EDGE = /[\s.,;:!?"“”()]/;

/** Trim punctuation/space from a selection and grow it to whole words. */
export function snapToWords(text, start, end) {
  while (start < end && EDGE.test(text[start])) start++;
  while (end > start && EDGE.test(text[end - 1])) end--;
  if (end <= start) return { start, end: start };
  while (start > 0 && WORD.test(text[start - 1])) start--;
  while (end < text.length && WORD.test(text[end])) end++;
  return { start, end };
}

/** Default node label from the selected text. */
export function tidyLabel(text) {
  let t = text.replace(/\s+/g, ' ').trim().replace(/^(the|a|an)\s+/i, '');
  if (t.length > 40) t = t.slice(0, 39).trimEnd() + '…';
  return t.charAt(0).toUpperCase() + t.slice(1);
}
