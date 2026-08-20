import { describe, expect, it } from "vitest";
import { asTyping, applyMode } from "../src/engine/variants.js";
import { grade } from "../src/engine/grading.js";

const blank = {
  id: "q1", type: "blank", ko: "나는 학생이다.",
  prefix: ["I"], answer: ["am"], suffix: ["a", "student", "."],
  distractors: ["is", "are"], explanation: "설명",
};

describe("영작 모드", () => {
  it("빈칸 문항이 문장 전체를 쓰는 문항이 된다", () => {
    const t = asTyping(blank);
    expect(t.type).toBe("typing");
    expect(t.answer).toEqual(["I", "am", "a", "student", "."]);
    expect(t.prefix).toEqual([]);
    expect(t.distractors).toEqual([]);
  });

  it("한국어 문장과 설명은 그대로 쓴다", () => {
    const t = asTyping(blank);
    expect(t.ko).toBe(blank.ko);
    expect(t.explanation).toBe(blank.explanation);
  });

  it("바뀐 문항을 채점할 수 있다", () => {
    const t = asTyping(blank);
    expect(grade(t, "I am a student.").correct).toBe(true);
    expect(grade(t, "I is a student.").correct).toBe(false);
  });

  it("대안 정답도 문장 전체로 늘어난다", () => {
    const t = asTyping({ ...blank, answer: ["do", "not"], suffix: ["go", "."], accept: [["don't"]] });
    expect(t.accept).toEqual([["I", "don't", "go", "."]]);
    expect(grade(t, "I don't go.").correct).toBe(true);
  });

  it("어순 배열도 바꿀 수 있다", () => {
    const arrange = { id: "q1", type: "arrange", ko: "그가 주었다", answer: ["He", "gave", "it"], explanation: "설명" };
    expect(asTyping(arrange).answer).toEqual(["He", "gave", "it"]);
  });

  it("카드가 없는 유형은 그대로 둔다", () => {
    const choice = { id: "q1", type: "choice", choices: ["go", "goes"], correct: 1, sentence: ["He", null] };
    expect(asTyping(choice)).toBe(choice);
  });

  it("카드 모드는 문항을 건드리지 않는다", () => {
    expect(applyMode(blank, "card")).toBe(blank);
    expect(applyMode(blank, "typing").type).toBe("typing");
  });
});
