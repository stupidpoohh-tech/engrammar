// localStorage / window 최소 구현 — 저장소 테스트가 브라우저 없이 돌게 한다.
const store = new Map();

globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

globalThis.window = globalThis.window ?? {
  addEventListener() {},
  removeEventListener() {},
};

export const resetStorage = () => store.clear();
