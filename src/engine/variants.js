// 같은 문항을 다른 방식으로 내는 변형.
//
// 영작 모드: 카드형 문항을 카드 없이 직접 타이핑하는 문항으로 바꾼다.
// 문항을 새로 쓰지 않고도 훨씬 어려운 연습이 되고, 실제 시험의 영작과 가깝다.
import { fullSentence } from "./grading.js";

/** blank / arrange 문항을 타이핑 문항으로. 그 외 유형은 그대로 둔다. */
export function asTyping(question) {
  if (question.type !== "blank" && question.type !== "arrange") return question;
  const answer = [...(question.prefix ?? []), ...(question.answer ?? []), ...(question.suffix ?? [])];
  const accept = (question.accept ?? []).map((alt) => [
    ...(question.prefix ?? []), ...alt, ...(question.suffix ?? []),
  ]);
  return {
    ...question,
    type: "typing",
    answer,
    accept: accept.length ? accept : undefined,
    prefix: [],
    suffix: [],
    distractors: [],
    origin: question.type,
    hint: fullSentence(question).length,
  };
}

export const MODES = [
  { id: "card", name: "카드", desc: "카드를 골라 문장을 완성" },
  { id: "typing", name: "영작", desc: "카드 없이 직접 입력 — 훨씬 어렵습니다" },
];

export function applyMode(question, mode) {
  return mode === "typing" ? asTyping(question) : question;
}
