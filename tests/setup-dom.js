// localStorage / window 최소 구현 — 저장소 테스트가 브라우저 없이 돌게 한다.
const store = new Map();

globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

// 이벤트를 실제로 붙였다 뗄 수 있어야 탭 간 동기화를 테스트할 수 있다
const handlers = new Map();

globalThis.window = {
  addEventListener(type, fn) {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type).add(fn);
  },
  removeEventListener(type, fn) {
    handlers.get(type)?.delete(fn);
  },
};

/** 다른 탭이 localStorage 를 바꾼 상황을 흉내 낸다. */
export function fireStorageEvent(key) {
  for (const fn of handlers.get("storage") ?? []) fn({ key });
}

export function resetStorage() {
  store.clear();
  handlers.clear();
}
