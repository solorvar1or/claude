// Placeholder convention: text in [[double brackets]] is data that must be
// confirmed by WOODGER before launch. It renders as a highlighted <mark>,
// so unfinished content is visible on every page during review.
const TODO_RE = /\[\[(.+?)\]\]/g;

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const rich = (s: string) =>
  escape(s).replace(TODO_RE, '<mark class="todo" title="Нужно уточнить у WOODGER">[$1]</mark>');

// For <title>, meta, alt and JSON-LD, where markup is not allowed.
export const plain = (s: string) => s.replace(TODO_RE, '[$1]');

export const hasTodo = (s: string) => /\[\[.+?\]\]/.test(s);
