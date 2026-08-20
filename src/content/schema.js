// 콘텐츠 형식 정의와 검증.
//
// 빌드(`npm run check`)와 테스트가 같은 함수를 쓴다. 새 챕터를 손으로 추가할 때
// 형식이 어긋나면 배포 전에 걸린다.
//
// ── 챕터 ─────────────────────────────────────────────────────
//   { id, title, kind: "basic"|"review"|"mega", blurb, summary: Block[], questions: Question[] }
//
// ── 블록(summary) ────────────────────────────────────────────
//   { t: "h",  text }                          제목
//   { t: "p",  text }                          문단
//   { t: "ul", items: string[] }               목록
//   { t: "table", head?: Cell[], rows: Cell[][] }
//   Cell = string | { text, span }
//   text 안에는 <b> <code> <s> <u> <br> 만 쓸 수 있다 (src/lib/inline.jsx 가 렌더).
//
// ── 문항 ─────────────────────────────────────────────────────
//   공통: { id, type, ko, explanation }
//   blank   빈칸에 카드를 골라 넣기   { prefix, answer, suffix, distractors, accept? }
//   arrange 카드로 문장 순서 맞추기   { answer, accept? }
//   choice  둘 이상 중 어법에 맞는 것 { choices: string[], correct: number, sentence: [ ..., null, ... ] }
//   error   틀린 부분 찾아 고치기     { tokens: string[], wrongIndex, fix }
//   typing  한국어를 보고 영작        { answer, accept? }  ← 카드 없이 직접 입력
//
//   accept 는 정답으로 인정할 대안 토큰 배열의 목록이다.
//     answer: ["do", "not"], accept: [["don't"]]  →  "do not" 과 "don't" 모두 정답

export const KINDS = ["basic", "review", "mega"];
export const QUESTION_TYPES = ["blank", "arrange", "choice", "error", "typing"];

const INLINE_OK = /^(?:[^<>]|<\/?(?:b|code|s|u)>|<br\s*\/?>)*$/;

const isStr = (v) => typeof v === "string";
const isStrArr = (v) => Array.isArray(v) && v.every(isStr);

function checkInline(text, where, out) {
  if (!isStr(text)) return out.push(`${where}: 문자열이 아님`);
  if (!INLINE_OK.test(text)) out.push(`${where}: 허용되지 않은 마크업 — ${text.slice(0, 50)}`);
}

function checkBlock(b, where, out) {
  if (!b || !isStr(b.t)) return out.push(`${where}: 블록 형식 아님`);
  if (b.t === "h" || b.t === "p") return checkInline(b.text, `${where}.text`, out);
  if (b.t === "ul") {
    if (!isStrArr(b.items) || !b.items.length) return out.push(`${where}: ul.items 비어 있음`);
    return b.items.forEach((it, i) => checkInline(it, `${where}.items[${i}]`, out));
  }
  if (b.t === "table") {
    if (!Array.isArray(b.rows) || !b.rows.length) out.push(`${where}: table.rows 비어 있음`);
    const cells = [...(b.head || []), ...(b.rows || []).flat()];
    cells.forEach((c, i) => {
      const text = isStr(c) ? c : c?.text;
      checkInline(text, `${where}.cell[${i}]`, out);
      if (!isStr(c) && c?.span != null && !(Number.isInteger(c.span) && c.span > 1)) {
        out.push(`${where}.cell[${i}]: span 은 2 이상의 정수여야 함`);
      }
    });
    return;
  }
  out.push(`${where}: 알 수 없는 블록 타입 "${b.t}"`);
}

function checkQuestion(q, where, out) {
  if (!isStr(q.id)) out.push(`${where}: id 없음`);
  if (!isStr(q.ko) || !q.ko.trim()) out.push(`${where}: ko 없음`);
  if (!QUESTION_TYPES.includes(q.type)) out.push(`${where}: 알 수 없는 type "${q.type}"`);
  checkInline(q.explanation ?? "", `${where}.explanation`, out);
  if (!q.explanation?.trim()) out.push(`${where}: explanation 없음`);

  if (q.accept != null) {
    if (!Array.isArray(q.accept) || !q.accept.every(isStrArr)) {
      out.push(`${where}: accept 는 문자열 배열의 배열이어야 함`);
    }
  }

  if (q.type === "blank" || q.type === "arrange" || q.type === "typing") {
    if (!isStrArr(q.answer) || !q.answer.length) out.push(`${where}: answer 비어 있음`);
    if (q.answer?.some((w) => !w.trim())) out.push(`${where}: answer 에 빈 토큰`);
  }
  if (q.type === "blank") {
    if (!isStrArr(q.prefix ?? [])) out.push(`${where}: prefix 형식 오류`);
    if (!isStrArr(q.suffix ?? [])) out.push(`${where}: suffix 형식 오류`);
    if (!isStrArr(q.distractors ?? [])) out.push(`${where}: distractors 형식 오류`);
    const lower = (q.distractors ?? []).map((d) => d.toLowerCase());
    // 정답 단어가 오답 카드에도 있으면 화면에 똑같은 카드가 두 장 뜬다.
    for (const a of q.answer ?? []) {
      if (lower.includes(a.toLowerCase())) out.push(`${where}: 정답 "${a}" 가 distractors 에도 있음`);
    }
    if (new Set(lower).size !== lower.length) out.push(`${where}: distractors 중복`);
  }
  if (q.type === "arrange") {
    if (q.distractors?.length) out.push(`${where}: arrange 에는 distractors 를 쓰지 않음`);
    if (q.answer?.length < 3) out.push(`${where}: arrange 는 3토큰 이상이어야 의미가 있음`);
  }
  if (q.type === "choice") {
    if (!isStrArr(q.choices) || q.choices.length < 2) out.push(`${where}: choices 는 2개 이상`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= (q.choices?.length ?? 0)) {
      out.push(`${where}: correct 인덱스가 범위를 벗어남`);
    }
    if (new Set(q.choices ?? []).size !== (q.choices ?? []).length) out.push(`${where}: choices 중복`);
    if (!Array.isArray(q.sentence) || !q.sentence.includes(null)) {
      out.push(`${where}: sentence 에 빈칸(null)이 정확히 있어야 함`);
    } else if (q.sentence.filter((t) => t === null).length !== 1) {
      out.push(`${where}: sentence 의 빈칸(null)은 하나여야 함`);
    }
  }
  if (q.type === "error") {
    if (!isStrArr(q.tokens) || q.tokens.length < 3) out.push(`${where}: tokens 는 3개 이상`);
    if (!Number.isInteger(q.wrongIndex) || q.wrongIndex < 0 || q.wrongIndex >= (q.tokens?.length ?? 0)) {
      out.push(`${where}: wrongIndex 가 범위를 벗어남`);
    }
    if (!isStr(q.fix) || !q.fix.trim()) out.push(`${where}: fix 없음`);
    if (q.tokens?.[q.wrongIndex] === q.fix) out.push(`${where}: fix 가 틀린 토큰과 같음`);
  }
}

/** 챕터 배열을 검증하고 사람이 읽을 수 있는 문제 목록을 돌려준다. 빈 배열이면 정상. */
export function validateChapters(chapters) {
  const out = [];
  if (!Array.isArray(chapters) || !chapters.length) return ["챕터가 없음"];

  const seenChapter = new Set();
  for (const c of chapters) {
    const where = `chapter[${c?.id ?? "?"}]`;
    if (!isStr(c?.id) || !c.id) { out.push(`${where}: id 없음`); continue; }
    if (seenChapter.has(c.id)) out.push(`${where}: 챕터 id 중복`);
    seenChapter.add(c.id);
    if (!isStr(c.title) || !c.title.trim()) out.push(`${where}: title 없음`);
    if (!KINDS.includes(c.kind)) out.push(`${where}: 알 수 없는 kind "${c.kind}"`);
    if (!Array.isArray(c.summary) || !c.summary.length) out.push(`${where}: summary 비어 있음`);
    else c.summary.forEach((b, i) => checkBlock(b, `${where}.summary[${i}]`, out));

    if (!Array.isArray(c.questions) || !c.questions.length) { out.push(`${where}: 문항 없음`); continue; }
    const seenQ = new Set();
    for (const q of c.questions) {
      if (seenQ.has(q?.id)) out.push(`${where}/${q.id}: 문항 id 중복`);
      seenQ.add(q?.id);
      checkQuestion(q, `${where}/${q?.id ?? "?"}`, out);
    }
  }
  return out;
}
