# 고등영어문법

고등학교 과정까지의 영어 문법 정리와 퀴즈 학습 도구.
정적 사이트라 백엔드·환경변수·API 키가 필요 없다.

- 65챕터 · 534문항
- 문법 정리 전체 검색, 챕터별 링크
- 오답노트와 복습 모드 — 틀린 문항이 기기에 남는다
- 문제 유형 5가지 (카드 빈칸 / 어순 배열 / 어법 선택 / 오류 찾기 / 영작)
- PWA — 설치하면 오프라인에서도 풀 수 있다

콘텐츠를 고치는 방법은 [CLAUDE.md](./CLAUDE.md) 를 본다.

---

## 로컬에서 실행

```bash
npm install
npm run dev      # http://localhost:5173
```

빌드 결과 확인:

```bash
npm run build
npm run preview  # http://localhost:4173
```

`npm run build` 는 콘텐츠 검증을 먼저 통과해야 진행된다. 통과하면 이렇게 나온다.

```
콘텐츠 검증 통과

  챕터   65
  문항   534
  유형   blank 430 · choice 30 · error 30 · arrange 44
  PART   18 / 5 / 4 / 7 / 6 / 6 / 6 / 5 / 8
```

## 테스트

```bash
npm test
```

---

## 배포

`dist/` 를 그대로 올리면 되는 정적 사이트다.

### Cloudflare Pages

1. Workers & Pages → Create → Pages → **Connect to Git** → 이 저장소 선택
2. 빌드 설정

   | 항목 | 값 |
   |---|---|
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | (비워둠) |

3. Save and Deploy

Node 버전은 저장소의 `.node-version`(22)을 Cloudflare 가 읽어 간다.
대시보드에서 `NODE_VERSION` 을 따로 넣을 필요가 없다.

이후로는 `git push` 만 하면 자동으로 다시 빌드·배포된다.

### Vercel

Add New → Project → 저장소 import → Framework Preset **Other** /
Build Command `npm run build` / Output Directory `dist`.

둘 중 하나만 쓰면 된다.

---

## 학습 기록은 어디에 저장되나

학습자의 **브라우저에만** 저장된다 (localStorage). 서버로 보내지 않는다.

그래서 기기를 바꾸거나 브라우저 데이터를 지우면 기록이 사라진다.
앱 안의 **기록 관리**(`#/settings`)에서 JSON 파일로 내보내고 다시 불러올 수 있다.

---

## 문제 해결

**빌드가 실패할 때**
대부분 콘텐츠 형식 문제다. `npm run check` 를 실행하면 어느 챕터의 무엇이
잘못됐는지 한 줄씩 알려준다.

**배포는 됐는데 옛 내용이 보일 때**
PWA 서비스워커가 이전 버전을 들고 있을 수 있다. 강력 새로고침
(Ctrl+Shift+R / Cmd+Shift+R)을 하거나 탭을 완전히 닫았다 열면 새 버전으로 갱신된다.

**빌드 로그에 Node 버전 오류가 날 때**
Vite 는 Node 18 이상이 필요하다. 저장소 루트의 `.node-version` 이 이를 지정하지만,
호스팅 쪽이 이 파일을 읽지 않는다면 환경변수 `NODE_VERSION` 을 `22` 로 넣는다.

**폰트가 시스템 폰트로 보일 때**
Pretendard·Noto Serif KR 은 CDN 에서 받아온다. 네트워크가 막히면 시스템 폰트로
자연스럽게 떨어지도록 되어 있다 — 화면이 깨지지는 않는다.
