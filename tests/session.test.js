import { describe, expect, it } from "vitest";
import {
  createSession, reducer, currentItem, sessionScore, canFinishEarly, canSubmit, makeBank,
} from "../src/engine/session.js";

const q = (id, answer, distractors = []) => ({
  id, type: "blank", ko: "테스트 " + id,
  prefix: [], answer, suffix: [], distractors, explanation: "설명",
});

const items = (n) => Array.from({ length: n }, (_, i) => ({
  chapterId: "ch", question: q("q" + (i + 1), ["a" + (i + 1)], ["x", "y", "z"]),
}));

/** 카드 뱅크에서 정답 토큰의 자리를 찾아 고른다. */
function answerCorrectly(state) {
  let s = state;
  for (const tok of currentItem(s).question.answer) {
    s = reducer(s, { type: "pick", index: s.bank.indexOf(tok) });
  }
  return reducer(s, { type: "submit" });
}

function answerWrong(state) {
  const s = reducer(state, { type: "pick", index: state.bank.findIndex((w) => w === "x") });
  return reducer(s, { type: "submit" });
}

describe("세션 진행", () => {
  it("문항을 순서대로 지나간다", () => {
    let s = createSession(items(3));
    expect(currentItem(s).question.id).toBe("q1");
    s = reducer(answerCorrectly(s), { type: "next" });
    expect(currentItem(s).question.id).toBe("q2");
  });

  it("모두 맞히면 끝난다", () => {
    let s = createSession(items(3));
    for (let i = 0; i < 3; i++) s = reducer(answerCorrectly(s), { type: "next" });
    expect(s.finished).toBe(true);
    expect(sessionScore(s)).toEqual({ score: 3, total: 3 });
  });

  it("틀린 문항은 큐 끝에 다시 붙는다", () => {
    let s = createSession(items(2));
    const before = s.queue.length;
    s = answerWrong(s);
    expect(s.queue.length).toBe(before + 1);
    expect(s.queue.at(-1).isRetry).toBe(true);
  });

  it("재시도는 성적에 반영되지 않는다", () => {
    let s = createSession(items(1));
    s = reducer(answerWrong(s), { type: "next" });   // 재시도 문항으로 이동
    expect(currentItem(s).isRetry).toBe(true);
    const before = sessionScore(s);
    s = answerCorrectly(s);
    expect(sessionScore(s)).toEqual(before);
  });

  it("연속 정답 기록을 남기고 틀리면 끊긴다", () => {
    let s = createSession(items(3));
    s = reducer(answerCorrectly(s), { type: "next" });
    s = reducer(answerCorrectly(s), { type: "next" });
    expect(s.maxStreak).toBe(2);
    s = answerWrong(s);
    expect(s.streak).toBe(0);
    expect(s.maxStreak).toBe(2);
  });
});

describe("미리 마치기", () => {
  it("첫 시도 5문항을 모두 맞히기 전에는 못 쓴다", () => {
    let s = createSession(items(8));
    for (let i = 0; i < 4; i++) s = reducer(answerCorrectly(s), { type: "next" });
    expect(canFinishEarly(s)).toBe(false);
  });

  it("5문항을 모두 맞히면 쓸 수 있다", () => {
    let s = createSession(items(8));
    for (let i = 0; i < 5; i++) s = reducer(answerCorrectly(s), { type: "next" });
    expect(canFinishEarly(s)).toBe(true);
  });

  it("하나라도 틀렸으면 못 쓴다", () => {
    let s = createSession(items(8));
    s = reducer(answerWrong(s), { type: "next" });
    for (let i = 0; i < 5; i++) s = reducer(answerCorrectly(s), { type: "next" });
    expect(canFinishEarly(s)).toBe(false);
  });

  it("남은 문항이 없으면 쓸 이유가 없다", () => {
    let s = createSession(items(5));
    for (let i = 0; i < 5; i++) s = reducer(answerCorrectly(s), { type: "next" });
    expect(canFinishEarly(s)).toBe(false);
  });

  // 구버전은 여기서 total 을 5로 못 박아 7문항을 맞히면 7/5(140%)가 기록됐다
  it("성적은 실제로 푼 문항 수로 계산한다 — 100%를 넘지 않는다", () => {
    let s = createSession(items(8));
    for (let i = 0; i < 7; i++) s = reducer(answerCorrectly(s), { type: "next" });
    expect(canFinishEarly(s)).toBe(true);
    s = reducer(s, { type: "finishEarly" });
    const { score, total } = sessionScore(s);
    expect({ score, total }).toEqual({ score: 7, total: 7 });
    expect(score / total).toBeLessThanOrEqual(1);
  });
});

describe("입력 상태", () => {
  it("답을 확인하기 전에는 카드를 뺄 수 있다", () => {
    let s = createSession(items(1));
    s = reducer(s, { type: "pick", index: 0 });
    s = reducer(s, { type: "pick", index: 1 });
    s = reducer(s, { type: "unpick", slot: 0 });
    expect(s.picked).toEqual([1]);
  });

  it("같은 카드를 두 번 고를 수 없다", () => {
    let s = createSession(items(1));
    s = reducer(s, { type: "pick", index: 0 });
    s = reducer(s, { type: "pick", index: 0 });
    expect(s.picked).toEqual([0]);
  });

  it("확인한 뒤에는 입력이 잠긴다", () => {
    let s = answerCorrectly(createSession(items(1)));
    const after = reducer(s, { type: "pick", index: 2 });
    expect(after.picked).toEqual(s.picked);
  });

  it("아무것도 고르지 않으면 확인할 수 없다", () => {
    const s = createSession(items(1));
    expect(canSubmit(s, currentItem(s).question)).toBe(false);
  });

  it("다음 문항으로 가면 입력이 비워진다", () => {
    let s = reducer(answerCorrectly(createSession(items(2))), { type: "next" });
    expect(s.picked).toEqual([]);
    expect(s.answered).toBe(false);
  });
});

describe("카드 섞기", () => {
  it("카드 뱅크는 정답과 오답을 모두 담는다", () => {
    const question = q("q1", ["am"], ["is", "are"]);
    expect(makeBank(question).sort()).toEqual(["am", "are", "is"]);
  });

  it("어순 배열은 정답 토큰만 담는다", () => {
    const question = { type: "arrange", answer: ["He", "gave", "me", "it"] };
    expect(makeBank(question).sort()).toEqual(["He", "gave", "it", "me"]);
  });

  // 구버전은 시드가 문제 위치뿐이라 몇 번을 다시 풀어도 배치가 같았다
  it("같은 문항을 다시 풀면 배치가 달라질 수 있다", () => {
    const question = q("q1", ["a"], ["b", "c", "d", "e", "f", "g", "h"]);
    const seen = new Set(Array.from({ length: 40 }, () => makeBank(question).join("|")));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("어순 배열은 원래 순서를 그대로 내주지 않는다", () => {
    const question = { type: "arrange", answer: ["a", "b", "c", "d", "e"] };
    for (let i = 0; i < 20; i++) {
      expect(makeBank(question).join("")).not.toBe("abcde");
    }
  });
});
