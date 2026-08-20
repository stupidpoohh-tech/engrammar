// 문법 검색.
//
// 65챕터 정도는 브라우저에서 통째로 훑어도 순식간이라 색인 서버가 필요 없다.
// 한 번 만든 색인은 재사용한다.
import { blocksToText } from "./blocks.jsx";
import { plainText } from "./inline.jsx";
import { fullSentence } from "../engine/grading.js";

let indexed = null;

function build(chapters) {
  return chapters.map((c) => {
    const body = blocksToText(c.summary);
    const examples = c.questions.map((q) => `${q.ko} ${fullSentence(q)} ${plainText(q.explanation)}`).join("\n");
    return {
      chapter: c,
      title: c.title,
      blurb: c.blurb ?? "",
      body,
      examples,
      haystack: `${c.title}\n${c.blurb ?? ""}\n${body}\n${examples}`.toLowerCase(),
    };
  });
}

export function getIndex(chapters) {
  if (!indexed || indexed.length !== chapters.length) indexed = build(chapters);
  return indexed;
}

/**
 * 검색. 공백으로 나눈 조각이 모두 들어 있는 챕터만 남기고,
 * 제목에 맞은 것을 위로 올린다. 결과마다 맞은 자리 주변을 잘라 보여준다.
 */
export function search(chapters, query, limit = 30) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const results = [];
  for (const entry of getIndex(chapters)) {
    if (!terms.every((t) => entry.haystack.includes(t))) continue;

    const title = entry.title.toLowerCase();
    const blurb = entry.blurb.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (title.includes(t)) score += title.startsWith(t) ? 100 : 60;
      if (blurb.includes(t)) score += 20;
      score += Math.min(10, occurrences(entry.body.toLowerCase(), t));
    }
    results.push({ chapter: entry.chapter, score, snippet: snippetFor(entry, terms) });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

function occurrences(text, term) {
  let n = 0, i = 0;
  while ((i = text.indexOf(term, i)) !== -1) { n++; i += term.length; }
  return n;
}

/** 첫 번째로 맞은 자리 주변을 잘라내고, 맞은 조각의 위치를 함께 넘긴다. */
function snippetFor(entry, terms) {
  const source = `${entry.body}\n${entry.examples}`.replace(/\s+/g, " ").trim();
  const lower = source.toLowerCase();
  let at = -1, term = "";
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) { at = i; term = t; }
  }
  if (at === -1) return null;

  const start = Math.max(0, at - 40);
  const end = Math.min(source.length, at + term.length + 80);
  return {
    before: (start > 0 ? "…" : "") + source.slice(start, at),
    match: source.slice(at, at + term.length),
    after: source.slice(at + term.length, end) + (end < source.length ? "…" : ""),
  };
}
