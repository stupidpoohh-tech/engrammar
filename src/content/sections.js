// 대단원(PART) 정의. 배열 순서 = 화면 표시 순서.
// 새 PART를 추가하려면 여기에 항목을 넣고, 같은 `id`를 챕터의 `section`에 쓴다.
// PART I 만 section 이 null 인데, 최초 18개 챕터가 section 필드 없이 만들어졌기 때문이다.

export const SECTIONS = [
  { id: "tense",     section: null,        roman: "PART I",    name: "동사 시제",       desc: "현재·과거·미래의 골격" },
  { id: "passive",   section: "passive",   roman: "PART II",   name: "수동태",         desc: "be + p.p 로 시점 바꾸기" },
  { id: "parts",     section: "parts",     roman: "PART III",  name: "품사",           desc: "명사·형용사·부사의 역할" },
  { id: "connect",   section: "connect",   roman: "PART IV",   name: "연결어와 조동사", desc: "접속사·전치사·조동사" },
  { id: "structure", section: "structure", roman: "PART V",    name: "문장 5형식",      desc: "S+V부터 S+V+O+OC까지" },
  { id: "tense2",    section: "tense2",    roman: "PART VI",   name: "시제 확장",       desc: "진행과 완료 — 시간을 다루는 정교한 도구" },
  { id: "verbal",    section: "verbal",    roman: "PART VII",  name: "준동사",         desc: "to부정사·동명사·분사" },
  { id: "relative",  section: "relative",  roman: "PART VIII", name: "관계사",         desc: "두 문장을 잇는 다리" },
  { id: "advanced",  section: "advanced",  roman: "PART IX",   name: "고급 표현",       desc: "가정법·비교·특수구문" },
];

export const sectionOf = (chapter) =>
  SECTIONS.find((s) => s.section === (chapter.section ?? null)) ?? SECTIONS[0];

export const sectionById = (id) => SECTIONS.find((s) => s.id === id);
