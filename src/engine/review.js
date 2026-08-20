// 오답노트와 복습 모드.
//
// 구버전에서 틀린 문제는 세션이 끝나면 사라졌다. 이제 문항 단위 이력이 남으므로
// "전 챕터에서 틀렸고 아직 숙달되지 않은 문항"을 모아 다시 풀 수 있다.
import { getItems, itemKey, MASTER_BOX } from "./storage.js";

/**
 * 오답노트에 들어 있는 문항들. 약한 것(최근에 틀린 것, box 가 낮은 것)이 앞에 온다.
 * chapters 가 아직 로드되지 않았으면 빈 배열.
 */
export function weakItems(chapters) {
  const items = getItems();
  const out = [];
  for (const chapter of chapters ?? []) {
    for (const question of chapter.questions) {
      const stat = items[itemKey(chapter.id, question.id)];
      if (!stat || stat.wrong === 0 || stat.box >= MASTER_BOX) continue;
      out.push({ chapterId: chapter.id, chapter, question, stat });
    }
  }
  return out.sort((a, b) => a.stat.box - b.stat.box || b.stat.wrong - a.stat.wrong || b.stat.lastAt - a.stat.lastAt);
}

/** 오답노트 크기만 알면 될 때 — 챕터 본문을 받아오지 않아도 된다. */
export function weakCount() {
  const items = getItems();
  return Object.values(items).filter((s) => s.wrong > 0 && s.box < MASTER_BOX).length;
}

/** 복습 세션용 문항 목록. 한 번에 너무 많이 주지 않는다. */
export function buildReviewItems(chapters, limit = 15) {
  return weakItems(chapters).slice(0, limit).map(({ chapterId, question }) => ({ chapterId, question }));
}

/** PART 별 정답률 — 취약한 단원을 짚어주는 데 쓴다. */
export function sectionStats(chapters) {
  const items = getItems();
  const by = new Map();
  for (const chapter of chapters ?? []) {
    const key = chapter.sectionId;
    const acc = by.get(key) ?? { sectionId: key, right: 0, wrong: 0, seen: 0, total: 0 };
    for (const question of chapter.questions) {
      acc.total++;
      const stat = items[itemKey(chapter.id, question.id)];
      if (!stat) continue;
      acc.seen++;
      acc.right += stat.right;
      acc.wrong += stat.wrong;
    }
    by.set(key, acc);
  }
  return [...by.values()].map((s) => ({
    ...s,
    accuracy: s.right + s.wrong > 0 ? s.right / (s.right + s.wrong) : null,
  }));
}
