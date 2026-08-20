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
import { useCallback, useEffect, useState } from "react";

export function parseHash(hash) {
  const path = (hash || "").replace(/^#\/?/, "");
  const [head, ...rest] = path.split("/").filter(Boolean);
  return { head: head || "home", id: rest[0] ?? null, rest };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((to, { replace } = {}) => {
    const next = to.startsWith("#") ? to : "#" + to;
    if (window.location.hash === next) return;
    if (replace) window.history.replaceState(null, "", next);
    else window.location.hash = next;
    if (replace) setRoute(parseHash(next));
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
