// 챕터 배열을 src/content/part*.js 로 다시 써 넣는다.
// 콘텐츠를 일괄 수정하는 유지보수 스크립트들이 함께 쓴다.
import fs from "node:fs";
import path from "node:path";

export const PART_FILES = [
  { sectionId: "tense",     file: "part1-tense.js",     varName: "part1Tense" },
  { sectionId: "passive",   file: "part2-passive.js",   varName: "part2Passive" },
  { sectionId: "parts",     file: "part3-parts.js",     varName: "part3Parts" },
  { sectionId: "connect",   file: "part4-connect.js",   varName: "part4Connect" },
  { sectionId: "structure", file: "part5-structure.js", varName: "part5Structure" },
  { sectionId: "tense2",    file: "part6-tense2.js",    varName: "part6Tense2" },
  { sectionId: "verbal",    file: "part7-verbal.js",    varName: "part7Verbal" },
  { sectionId: "relative",  file: "part8-relative.js",  varName: "part8Relative" },
  { sectionId: "advanced",  file: "part9-advanced.js",  varName: "part9Advanced" },
];

const q = (s) => JSON.stringify(s);
const arr = (a) => `[${a.map(q).join(", ")}]`;
const cell = (c) => (typeof c === "string" ? q(c) : `{ text: ${q(c.text)}, span: ${c.span} }`);

function fmtBlock(b, ind) {
  const p = " ".repeat(ind);
  if (b.t === "h") return `${p}{ t: "h", text: ${q(b.text)} }`;
  if (b.t === "p") return `${p}{ t: "p", text: ${q(b.text)} }`;
  if (b.t === "ul") {
    return `${p}{\n${p}  t: "ul",\n${p}  items: [\n` +
      b.items.map((it) => `${p}    ${q(it)}`).join(",\n") + `,\n${p}  ],\n${p}}`;
  }
  const head = b.head?.length ? `${p}  head: [${b.head.map(cell).join(", ")}],\n` : "";
  const rows = b.rows.map((r) => `${p}    [${r.map(cell).join(", ")}]`).join(",\n");
  return `${p}{\n${p}  t: "table",\n${head}${p}  rows: [\n${rows},\n${p}  ],\n${p}}`;
}

function fmtQuestion(qq) {
  const L = [`    id: ${q(qq.id)},`, `    type: ${q(qq.type)},`, `    ko: ${q(qq.ko)},`];
  if (qq.prefix?.length) L.push(`    prefix: ${arr(qq.prefix)},`);
  if (qq.answer?.length) L.push(`    answer: ${arr(qq.answer)},`);
  if (qq.suffix?.length) L.push(`    suffix: ${arr(qq.suffix)},`);
  if (qq.distractors?.length) L.push(`    distractors: ${arr(qq.distractors)},`);
  if (qq.choices?.length) L.push(`    choices: ${arr(qq.choices)},`);
  if (qq.correct != null) L.push(`    correct: ${qq.correct},`);
  if (qq.sentence) L.push(`    sentence: [${qq.sentence.map((t) => (t === null ? "null" : q(t))).join(", ")}],`);
  if (qq.tokens?.length) L.push(`    tokens: ${arr(qq.tokens)},`);
  if (qq.wrongIndex != null) L.push(`    wrongIndex: ${qq.wrongIndex},`);
  if (qq.fix != null) L.push(`    fix: ${q(qq.fix)},`);
  if (qq.accept?.length) L.push(`    accept: [${qq.accept.map(arr).join(", ")}],`);
  L.push(`    explanation: ${q(qq.explanation)},`);
  return `  {\n${L.join("\n")}\n  }`;
}

function fmtChapter(c) {
  const indent = (s) => s.split("\n").map((l) => "  " + l).join("\n");
  return [
    `{`,
    `  id: ${q(c.id)},`,
    `  title: ${q(c.title)},`,
    `  kind: ${q(c.kind)},`,
    `  blurb: ${q(c.blurb ?? "")},`,
    `  summary: [`,
    c.summary.map((b) => fmtBlock(b, 4)).join(",\n") + ",",
    `  ],`,
    `  questions: [`,
    c.questions.map(fmtQuestion).map(indent).join(",\n") + ",",
    `  ],`,
    `}`,
  ].join("\n");
}

/** chapters(sectionId 를 가진 배열)를 PART 파일들로 나눠 쓴다. */
export function writeContent(chapters, outDir = "src/content") {
  for (const part of PART_FILES) {
    const items = chapters.filter((c) => c.sectionId === part.sectionId);
    if (!items.length) throw new Error(`PART 비어 있음: ${part.file}`);
    const body = items
      .map((c) => fmtChapter(c).split("\n").map((l) => "  " + l).join("\n"))
      .join(",\n\n");
    const src =
      `// ${part.varName} — 콘텐츠 파일. 형식은 src/content/schema.js 참고.\n\n` +
      `export const ${part.varName} = [\n${body},\n];\n`;
    fs.writeFileSync(path.join(outDir, part.file), src);
  }
}
