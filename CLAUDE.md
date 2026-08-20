# 영어문법 학습 (engrammar)

고등학교 과정까지의 영어 문법을 **정리해 읽고**, **퀴즈로 익히는** 웹앱.
한국어 문장을 보고 영어 카드를 고르거나 직접 써서 문장을 완성한다.

---

## 프로젝트 구조

```
.
├── CLAUDE.md              ← 이 문서
├── README.md              ← 설치·배포 안내
├── index.html             ← 진입점
├── vite.config.js         ← 빌드 · PWA 설정
├── vitest.config.js
├── src/
│   ├── main.jsx           ← 마운트
│   ├── App.jsx            ← 라우팅 · 화면 선택
│   ├── content/           ← ★ 문법 데이터 (가장 자주 수정)
│   │   ├── schema.js      ← 형식 정의 + 검증 (여기부터 읽을 것)
│   │   ├── sections.js    ← PART 정의
│   │   ├── part1~9.js     ← 챕터 본문·문항
│   │   ├── all.js         ← 9개 PART 병합 (동적 import 대상)
│   │   ├── manifest.js    ← 자동 생성 — 직접 고치지 말 것
│   │   └── index.js       ← 콘텐츠 접근 지점
│   ├── engine/            ← 도메인 로직 (화면과 분리, 테스트 대상)
│   │   ├── grading.js     ← 채점
│   │   ├── session.js     ← 퀴즈 세션 리듀서
│   │   ├── storage.js     ← localStorage (진도 · 문항 이력)
│   │   ├── review.js      ← 오답노트 · 복습 선정
│   │   ├── variants.js    ← 영작 모드 변환
│   │   └── shuffle.js
│   ├── lib/               ← 렌더링 · 라우팅 · 검색
│   ├── components/        ← 공용 부품
│   ├── screens/           ← 화면들
│   └── styles/app.css
├── scripts/
│   ├── check-content.mjs  ← 배포 전 콘텐츠 점검 (build · CI 가 실행)
│   ├── gen-manifest.mjs   ← manifest 재생성
│   ├── gen-icons.mjs      ← 앱 아이콘 생성
│   └── lib/emit.mjs       ← 콘텐츠 파일 일괄 재작성용
└── tests/                 ← vitest
```

`dist/` 는 빌드 산출물이다. 직접 편집하지 말 것.

---

## 명령어

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 콘텐츠 점검 → dist/ 빌드
npm run preview  # 빌드 결과 미리보기
npm test         # 전체 테스트
npm run check    # 콘텐츠만 점검 (챕터 수·유형 분포 요약 출력)
```

`npm run build` 는 **콘텐츠 검증을 먼저 통과해야** 진행된다.
형식이 어긋난 챕터를 배포할 수 없다.

---

## 운영 모드

- 문법 데이터의 유일한 출처는 `src/content/part*.js`. 백엔드·API 키가 없다.
- 진도와 오답노트는 **학습자 브라우저 localStorage** 에만 저장된다.
  - `engrammar.progress.v2` — 챕터별 완료·최고 기록
  - `engrammar.items.v2` — 문항별 정답/오답 이력 (오답노트의 근거)
  - `engrammar.prefs.v1` — 접힘 상태·푸는 방식
  - 구버전 `engquiz.progress.v1` 은 처음 한 번 자동으로 옮겨온다.
- 기기 간 동기화는 없다. 대신 `#/settings` 에서 JSON 으로 내보내고 불러올 수 있다.
- PWA — 설치·오프라인 학습이 된다. 서비스워커는 `vite-plugin-pwa` 가 만든다.

---

## 콘텐츠 추가 · 수정

`src/content/part*.js` 배열에 챕터 객체를 넣는다. **배열 순서 = 화면 표시 순서.**
`section` 은 적지 않는다 — 어느 파일에 있느냐가 소속을 결정한다.

```js
{
  id: "unique-id",        // 영문 고유 ID (전체에서 중복 불가)
  title: "현재완료",
  kind: "basic",          // "basic" | "review" | "mega"
  blurb: "have/has + p.p",
  summary: [ /* 블록 배열 */ ],
  questions: [ /* 문항 배열 */ ],
}
```

### summary — 블록 배열

HTML 문자열이 아니라 구조화된 블록이다. 검색·인쇄·스타일 일관성을 위해서다.

```js
{ t: "h",  text: "be동사란?" }
{ t: "p",  text: "be동사는 <b>주어의 상태</b>를 나타냅니다." }
{ t: "ul", items: ["첫째", "둘째"] }
{ t: "table", head: ["주어", "be동사"], rows: [["I", "<code>am</code>"]] }
```

표의 칸은 문자열이거나 `{ text, span }`(가로 병합)이다.
`text` 안에는 **`<b> <code> <s> <u> <br>` 다섯 개만** 쓸 수 있다.
그 밖의 태그는 렌더러가 글자로 취급하고 검증에서 걸린다.
(`dangerouslySetInnerHTML` 을 쓰는 곳이 하나도 없다 — 마크업 주입 경로를 없앴다.)

### 문항 — 다섯 가지 유형

공통 필드: `id`, `type`, `ko`, `explanation`

| type | 하는 일 | 필요한 필드 |
|---|---|---|
| `blank` | 빈칸에 카드를 골라 넣기 | `prefix` `answer` `suffix` `distractors` |
| `arrange` | 카드로 문장 순서 맞추기 | `answer` (3토큰 이상) |
| `choice` | 둘 이상 중 어법에 맞는 것 고르기 | `sentence`(null 하나) `choices` `correct` |
| `error` | 틀린 곳 짚고 고치기 | `tokens` `wrongIndex` `fix` |
| `typing` | 카드 없이 직접 영작 | `answer` |

```js
// blank
{ id: "q1", type: "blank", ko: "나는 학생이다.",
  prefix: ["I"], answer: ["am"], suffix: ["a", "student", "."],
  distractors: ["is", "are", "be"],
  explanation: "주어가 <b>I</b>일 때는 <code>am</code>." }

// choice
{ id: "c1", type: "choice", ko: "그는 매일 축구를 한다.",
  sentence: ["He", null, "soccer every day", "."],
  choices: ["play", "plays"], correct: 1,
  explanation: "3인칭 단수 현재 → <code>-s</code>." }

// error
{ id: "e1", type: "error", ko: "나는 학생이 아니다.",
  tokens: ["I", "are", "not", "a", "student", "."], wrongIndex: 1, fix: "am",
  explanation: "주어가 <b>I</b>면 <code>am</code>." }
```

`accept` 로 대안 정답을 적을 수 있다 — `accept: [["don't"]]`.
축약형(`do not` ↔ `don't`)과 대소문자·따옴표 모양은 채점기가 알아서 흡수한다.

### 카드 문항을 만들 때 지켜야 할 것

검증(`npm run check`)과 테스트가 아래를 강제한다.

1. **정답 단어를 `distractors` 에 다시 넣지 말 것.** 화면에 똑같은 카드가 두 장 뜬다.
   `will be` 처럼 여러 단어가 한 덩어리로 정답이면 `answer: ["will be"]` 한 장으로 만든다.
2. `distractors` 끼리도 겹치면 안 된다.
3. **가장 긴 정답 카드가 가장 긴 오답 카드보다 길면 안 된다.**
   읽지 않고 길이만 보고 고를 수 있게 된다.
4. 각 PART 의 마지막 챕터는 `review` 또는 `mega` 여야 한다.

콘텐츠를 고친 뒤 문항 수가 바뀌면 `node scripts/gen-manifest.mjs` 를 실행한다.
(잊어도 `npm run build` 가 막아준다.)

---

## 화면과 주소

| 주소 | 화면 |
|---|---|
| `#/` | 홈 — PART 목차, 복습·오답노트 바로가기 |
| `#/chapter/:id` | 챕터 표지 — 문법 요약 + 푸는 방식 선택 |
| `#/quiz/:id` | 챕터 퀴즈 |
| `#/review` | 오답 복습 세션 (전 챕터에서 약한 문항만) |
| `#/wrong` | 오답노트 목록 |
| `#/grammar` · `#/grammar/:id` | 문법 모아보기 — 검색 + 챕터별 링크 |
| `#/stats` | 학습 통계 |
| `#/settings` | 기록 내보내기·불러오기·초기화 |

---

## UI 동작 규칙

- 홈의 대단원은 첫 방문 시 **모두 접혀 있다.** 접힘 상태는 저장된다.
- **"중학교"라는 표현은 쓰지 않는다.** (고등 과정까지 다룬다)
- 카드 배치는 **문항을 볼 때마다 새로 섞는다.** 같은 챕터를 다시 풀어도 배치가 다르다.
- 틀린 문항은 그 세션 안에서 큐 끝에 다시 붙고, 동시에 오답노트에 남는다.
  세션 안의 재시도는 성적과 문항 이력에 반영하지 않는다 — 방금 본 답을 다시 친 것이라
  숙달로 볼 수 없기 때문이다.
- 오답노트에서 빠지려면 **연속으로 3번** 맞혀야 한다 (`MASTER_BOX`).
- PC 에서는 키보드로만 풀 수 있다 — `1`~`9` 고르기, `Backspace` 되돌리기, `Enter` 확인/계속.

---

## 커리큘럼 현황

65챕터 / 534문항 (`blank` 430 · `arrange` 44 · `choice` 30 · `error` 30).
각 PART 마지막에 정리 챕터가 있고, 정리 챕터에는 어법 선택·오류 찾기 문항이 붙어 있다.

아직 없는 항목:
- 부가의문문 (~, isn't it?)
- 부정대명사·재귀대명사 심화 (some/any/all/both, myself)
- 시제 일치의 예외

---

## 작업 시 주의사항

1. 콘텐츠 파일이 크다. 챕터를 추가할 때 파일 전체를 다시 쓰지 말고 해당 위치만 편집한다.
   여러 챕터를 한꺼번에 손봐야 하면 `scripts/lib/emit.mjs` 의 `writeContent()` 를 쓰는
   1회성 스크립트를 만드는 편이 안전하다.
2. 새 챕터는 **자연스러운 학습 순서**를 고려해 배열 중간에 넣는다.
   정리(`review`/`mega`) 챕터는 언제나 PART 의 마지막에 둔다.
3. 문법 설명은 고등 수준. 예문은 실제 시험에 나올 법한 것으로.
4. 수정 후 `npm test && npm run build` 를 돌려 확인한다.
