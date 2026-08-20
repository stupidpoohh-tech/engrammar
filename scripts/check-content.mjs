#!/usr/bin/env node
/**
 * 배포 전 콘텐츠 점검. `npm run build` 와 CI 가 이걸 먼저 돌린다.
 *
 *   1. 스키마 검증 (형식·중복·정답/오답 충돌)
 *   2. manifest 가 콘텐츠와 어긋나지 않는지
 *   3. 사람이 볼 요약 (챕터·문항·유형 분포)
 */
import fs from "node:fs";
import { CHAPTERS } from "../src/content/all.js";
import { validateChapters } from "../src/content/schema.js";
import { SECTIONS } from "../src/content/sections.js";
import { source as manifestSource } from "./gen-manifest.mjs";

let failed = false;

const problems = validateChapters(CHAPTERS);
if (problems.length) {
  failed = true;
  console.error(`콘텐츠 검증 실패 — ${problems.length}건`);
  problems.slice(0, 30).forEach((p) => console.error("  - " + p));
  if (problems.length > 30) console.error(`  ... 외 ${problems.length - 30}건`);
} else {
  console.log("콘텐츠 검증 통과");
}

const current = fs.existsSync("src/content/manifest.js")
  ? fs.readFileSync("src/content/manifest.js", "utf8")
  : "";
if (current !== manifestSource) {
  failed = true;
  console.error("manifest.js 가 콘텐츠와 다릅니다 — `node scripts/gen-manifest.mjs` 를 실행하세요.");
}

// 각 PART 는 마지막 챕터가 review 또는 mega 여야 한다 (단원 정리로 마무리)
for (const sec of SECTIONS) {
  const items = CHAPTERS.filter((c) => c.sectionId === sec.id);
  if (!items.length) { failed = true; console.error(`${sec.roman}: 챕터 없음`); continue; }
  const last = items[items.length - 1];
  if (last.kind === "basic") {
    console.warn(`  경고 ${sec.roman}: 마지막 챕터 "${last.title}" 가 정리(review/mega)가 아닙니다`);
  }
}

const types = {};
for (const c of CHAPTERS) for (const q of c.questions) types[q.type] = (types[q.type] ?? 0) + 1;
const total = Object.values(types).reduce((a, b) => a + b, 0);

console.log(`\n  챕터   ${CHAPTERS.length}`);
console.log(`  문항   ${total}`);
console.log(`  유형   ${Object.entries(types).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
console.log(`  PART   ${SECTIONS.map((s) => CHAPTERS.filter((c) => c.sectionId === s.id).length).join(" / ")}`);

process.exit(failed ? 1 : 0);
