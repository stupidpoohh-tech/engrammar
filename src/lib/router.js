// 해시 라우팅.
//
//   #/                      홈
//   #/chapter/:id           챕터 표지 (문법 요약 + 시작)
//   #/quiz/:id              챕터 퀴즈
//   #/review                오답 복습 세션
//   #/wrong                 오답노트 목록
//   #/grammar               문법 모아보기
//   #/grammar/:id           특정 챕터의 문법  ← 링크·북마크 가능
//   #/stats                 학습 통계
//   #/settings              기록 내보내기·불러오기·초기화
import { useCallback, useEffect, useRef, useState } from "react";

export function parseHash(hash) {
  const path = (hash || "").replace(/^#\/?/, "");
  const [head, ...rest] = path.split("/").filter(Boolean);
  return { head: head || "home", id: rest[0] ?? null, rest };
}

/**
 * 화면 이동은 History API 로 남긴다.
 *
 * 예전에는 `location.hash = ...` 로 옮겼는데, 그러면 pushState 기록이 남지 않아
 * 분석 도구가 화면 이동을 볼 수 없다 (첫 진입만 한 번 세고 끝난다).
 * 주소 모양(`#/chapter/be-aff`)은 그대로다.
 */
export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  const lastHash = useRef(window.location.hash);

  useEffect(() => {
    // popstate — 뒤로/앞으로 가기, hashchange — 주소창을 직접 고친 경우.
    // 해시가 바뀌면 브라우저가 둘 다 쏘기도 하므로 실제로 바뀌었을 때만 반영한다.
    const sync = () => {
      const hash = window.location.hash;
      if (hash === lastHash.current) return;
      lastHash.current = hash;
      setRoute(parseHash(hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const navigate = useCallback((to, { replace } = {}) => {
    const next = to.startsWith("#") ? to : "#" + to;
    if (window.location.hash === next) return;
    window.history[replace ? "replaceState" : "pushState"](null, "", next);
    lastHash.current = next;
    setRoute(parseHash(next));
    window.scrollTo(0, 0);
  }, []);

  return [route, navigate];
}

export const paths = {
  home: () => "#/",
  chapter: (id) => `#/chapter/${id}`,
  quiz: (id) => `#/quiz/${id}`,
  review: () => "#/review",
  wrong: () => "#/wrong",
  grammar: (id) => (id ? `#/grammar/${id}` : "#/grammar"),
  stats: () => "#/stats",
  settings: () => "#/settings",
};
