// 전체 챕터 — 앱에서는 동적 import 로만 불러온다 (src/content/index.js 참고).
// 이 모듈은 별도 청크로 분리되므로 홈 첫 화면에는 포함되지 않는다.
import { part1Tense } from "./part1-tense.js";
import { part2Passive } from "./part2-passive.js";
import { part3Parts } from "./part3-parts.js";
import { part4Connect } from "./part4-connect.js";
import { part5Structure } from "./part5-structure.js";
import { part6Tense2 } from "./part6-tense2.js";
import { part7Verbal } from "./part7-verbal.js";
import { part8Relative } from "./part8-relative.js";
import { part9Advanced } from "./part9-advanced.js";
import { SECTIONS } from "./sections.js";

const PARTS = [
  part1Tense, part2Passive, part3Parts, part4Connect, part5Structure,
  part6Tense2, part7Verbal, part8Relative, part9Advanced,
];

// PART 파일에는 section 필드를 적지 않는다 — 파일 자체가 소속을 결정한다.
export const CHAPTERS = PARTS.flatMap((chapters, i) =>
  chapters.map((c) => ({ ...c, section: SECTIONS[i].section, sectionId: SECTIONS[i].id }))
);
