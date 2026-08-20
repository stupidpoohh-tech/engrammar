// 콘텐츠 접근 지점.
//
// 홈 화면은 `manifest.js`(가벼운 메타데이터)만 보고 즉시 그린다.
// 본문·문항이 필요한 화면은 `loadChapters()` 로 큰 청크를 한 번만 받아온다.
import { MANIFEST } from "./manifest.js";

export { MANIFEST };
export { SECTIONS, sectionById, sectionOf } from "./sections.js";

let cache = null;
let pending = null;

export function loadChapters() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = import("./all.js").then((m) => {
      cache = m.CHAPTERS;
      pending = null;
      return cache;
    });
  }
  return pending;
}

/** 이미 받아온 챕터. 아직이면 null — 로딩 상태를 구분해야 하는 곳에서 쓴다. */
export const peekChapters = () => cache;

/** 다음 화면에서 쓸 가능성이 높을 때 미리 받아둔다 (실패해도 무시). */
export const prefetchChapters = () => { loadChapters().catch(() => {}); };
