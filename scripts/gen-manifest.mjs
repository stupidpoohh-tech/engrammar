#!/usr/bin/env node
/**
 * 홈 화면용 가벼운 메타데이터를 만든다.
 *
 * 챕터 본문·문항 전체는 별도 청크(all.js)로 빠지고, 홈은 이 manifest 만 보고
 * 즉시 목차를 그린다. 파일은 커밋되며 `npm run check` 가 최신인지 확인한다.
 */
import fs from "node:fs";
import { CHAPTERS } from "../src/content/all.js";

const rows = CHAPTERS.map((c) =>
  `  { id: ${JSON.stringify(c.id)}, sectionId: ${JSON.stringify(c.sectionId)}, ` +
  `kind: ${JSON.stringify(c.kind)}, title: ${JSON.stringify(c.title)}, ` +
  `short: ${JSON.stringify(c.short)}, group: ${JSON.stringify(c.group ?? null)}, ` +
  `count: ${c.questions.length} }`
).join(",\n");

export const source =
  `// 자동 생성 파일 — 직접 고치지 말 것. \`npm run check\` 가 다시 만든다.\n` +
  `// 홈 화면이 큰 콘텐츠 청크를 기다리지 않고 목차를 그리기 위한 메타데이터.\n\n` +
  `export const MANIFEST = [\n${rows},\n];\n`;

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.writeFileSync("src/content/manifest.js", source);
  console.log(`manifest 생성 — ${CHAPTERS.length}챕터`);
}
