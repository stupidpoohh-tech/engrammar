// Cloudflare Web Analytics.
//
// 토큰은 저장소에 넣지 않는다 — 배포 환경변수 `VITE_CF_BEACON_TOKEN` 으로 넣으면
// 그때만 비콘이 붙는다. 값이 없으면(로컬 개발) 아무것도 하지 않는다.
//
// 화면 이동은 라우터가 History API 로 남기므로(src/lib/router.js) 비콘의 SPA 추적이
// 챕터·퀴즈 이동을 따라간다. 쿠키를 쓰지 않아 동의 배너가 필요 없다.

const TOKEN = import.meta.env.VITE_CF_BEACON_TOKEN;
const BEACON = "https://static.cloudflareinsights.com/beacon.min.js";

export function startAnalytics() {
  if (!TOKEN) return;
  // Cloudflare Pages 설정에서 자동 삽입을 켜 두었다면 이미 붙어 있다 — 두 번 세지 않게 한다.
  if (document.querySelector("script[data-cf-beacon]")) return;

  const el = document.createElement("script");
  el.defer = true;
  el.src = BEACON;
  el.setAttribute("data-cf-beacon", JSON.stringify({ token: TOKEN, spa: true }));
  // 오프라인이면 그냥 실패한다. 학습에는 영향이 없어야 하므로 조용히 넘어간다.
  el.addEventListener("error", () => {});
  document.head.appendChild(el);
}
