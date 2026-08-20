// 학습 기록 저장소 (localStorage 전용 — 서버 없음).
//
// 저장하는 것 두 가지:
//   progress  챕터별 완료 여부와 최고 기록
//   items     문항 하나하나의 정답/오답 이력  ← 오답노트와 복습 모드가 여기서 나온다
//
// 구버전(engquiz.*)에는 문항 단위 기록이 없어서 틀린 문제가 세션과 함께 사라졌다.
// 같은 도메인에 남아 있는 옛 진도는 처음 한 번 옮겨온다.

const K_PROGRESS = "engrammar.progress.v2";
const K_ITEMS = "engrammar.items.v2";
const K_PREFS = "engrammar.prefs.v1";
const K_MIGRATED = "engrammar.migrated.v1";
const LEGACY_PROGRESS = "engquiz.progress.v1";

/** 오답노트에서 빠지려면 연속으로 이만큼 맞혀야 한다. */
export const MASTER_BOX = 3;

const listeners = new Set();

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패(용량 초과·시크릿 모드)해도 학습 자체는 계속되어야 한다
  }
}

function emit() {
  for (const fn of listeners) fn();
}

/** React 의 useSyncExternalStore 용. 다른 탭의 변경도 함께 받는다. */
function dropCaches() {
  progressCache = null;
  itemsCache = null;
  prefsCache = null;
}

export function subscribe(fn) {
  listeners.add(fn);
  // 다른 탭에서 바뀐 경우 캐시를 먼저 버려야 한다.
  // 버리지 않으면 getSnapshot 이 옛 객체를 그대로 돌려줘 React 가 다시 그리지 않는다.
  const onStorage = (e) => {
    if (e.key && !e.key.startsWith("engrammar.")) return;
    dropCaches();
    fn();
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}

// ── 진도 ──────────────────────────────────────────────────────
let progressCache = null;

export function getProgress() {
  if (!progressCache) progressCache = read(K_PROGRESS, {});
  return progressCache;
}

/**
 * 챕터를 완료로 기록한다. 최고 기록은 정답률로 비교하되,
 * 같은 비율이면 더 많이 푼 쪽을 남긴다 (5/5 가 8/8 을 밀어내지 않게).
 */
export function recordChapterResult(chapterId, score, total) {
  const p = { ...getProgress() };
  const prev = p[chapterId];
  const better =
    !prev?.best ||
    score / total > prev.best.score / prev.best.total ||
    (score / total === prev.best.score / prev.best.total && total > prev.best.total);

  p[chapterId] = {
    completed: true,
    best: better ? { score, total } : prev.best,
    lastAt: Date.now(),
  };
  progressCache = p;
  write(K_PROGRESS, p);
  emit();
  return p;
}

// ── 문항 이력 ─────────────────────────────────────────────────
let itemsCache = null;

export const itemKey = (chapterId, questionId) => `${chapterId}/${questionId}`;

export function getItems() {
  if (!itemsCache) itemsCache = read(K_ITEMS, {});
  return itemsCache;
}

export function getItem(chapterId, questionId) {
  return getItems()[itemKey(chapterId, questionId)] ?? null;
}

/**
 * 한 문항의 채점 결과를 남긴다.
 * box 는 연속 정답 횟수 — 틀리면 0으로 떨어지고 MASTER_BOX 에 닿으면 오답노트에서 빠진다.
 * 같은 세션 안의 재시도(retry)는 이력을 건드리지 않는다. 방금 본 답을 다시 친 것뿐이라
 * 숙달로 볼 수 없기 때문이다.
 */
export function recordAnswer(chapterId, questionId, correct) {
  const key = itemKey(chapterId, questionId);
  const items = { ...getItems() };
  const prev = items[key] ?? { right: 0, wrong: 0, box: 0, lastAt: 0 };

  items[key] = {
    right: prev.right + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    box: correct ? Math.min(MASTER_BOX, prev.box + 1) : 0,
    lastAt: Date.now(),
    lastCorrect: correct,
  };
  itemsCache = items;
  write(K_ITEMS, items);
  emit();
}

/** 오답노트에 남아 있는 문항 키들 — 한 번이라도 틀렸고 아직 숙달되지 않은 것. */
export function weakKeys() {
  const items = getItems();
  return Object.keys(items).filter((k) => items[k].wrong > 0 && items[k].box < MASTER_BOX);
}

export function clearItem(chapterId, questionId) {
  const items = { ...getItems() };
  delete items[itemKey(chapterId, questionId)];
  itemsCache = items;
  write(K_ITEMS, items);
  emit();
}

// ── 화면 설정 ─────────────────────────────────────────────────
let prefsCache = null;

export function getPrefs() {
  if (!prefsCache) prefsCache = read(K_PREFS, {});
  return prefsCache;
}

export function setPref(key, value) {
  prefsCache = { ...getPrefs(), [key]: value };
  write(K_PREFS, prefsCache);
  emit();
}

// ── 전체 초기화 / 내보내기 ────────────────────────────────────
export function exportAll() {
  return { version: 2, exportedAt: Date.now(), progress: getProgress(), items: getItems(), prefs: getPrefs() };
}

export function importAll(data) {
  if (!data || typeof data !== "object") throw new Error("형식이 올바르지 않습니다");
  if (data.progress) { progressCache = data.progress; write(K_PROGRESS, data.progress); }
  if (data.items) { itemsCache = data.items; write(K_ITEMS, data.items); }
  if (data.prefs) { prefsCache = data.prefs; write(K_PREFS, data.prefs); }
  emit();
}

export function resetAll() {
  progressCache = {};
  itemsCache = {};
  prefsCache = {};
  [K_PROGRESS, K_ITEMS, K_PREFS].forEach((k) => {
    try { localStorage.removeItem(k); } catch {}
  });
  emit();
}

// ── 구버전 진도 이전 ──────────────────────────────────────────
export function migrateLegacy() {
  try {
    if (localStorage.getItem(K_MIGRATED)) return;
    localStorage.setItem(K_MIGRATED, "1");
    const old = read(LEGACY_PROGRESS, null);
    if (!old || typeof old !== "object") return;

    const p = { ...getProgress() };
    let moved = 0;
    for (const [id, v] of Object.entries(old)) {
      if (p[id] || !v?.completed) continue;
      // 옛 데이터에는 100%를 넘는 기록이 섞여 있다(미리 마치기 버그). 비율을 1로 자른다.
      const total = Math.max(1, v.total ?? 0);
      const score = Math.min(total, Math.max(0, v.score ?? 0));
      p[id] = { completed: true, best: { score, total }, lastAt: v.completedAt ?? Date.now() };
      moved++;
    }
    if (moved) { progressCache = p; write(K_PROGRESS, p); emit(); }
  } catch {
    // 이전에 실패해도 새로 시작하면 될 뿐이다
  }
}
