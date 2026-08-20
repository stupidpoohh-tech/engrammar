import { describe, expect, it } from "vitest";
import { grade, normSentence, tokenize, fullSentence, joinTokens } from "../src/engine/grading.js";

const blank = {
  type: "blank",
  ko: "나는 학생이 아니다.",
  prefix: ["I"], answer: ["am", "not"], suffix: ["a", "student", "."],
  distractors: ["is not", "are not", "not am"],
};

describe("채점 — 카드형", () => {
  it("정답 순서가 맞으면 정답", () => {
    expect(grade(blank, ["am", "not"]).correct).toBe(true);
  });
  it("순서가 다르면 오답", () => {
    expect(grade(blank, ["not", "am"]).correct).toBe(false);
  });
  it("개수가 모자라면 오답", () => {
    expect(grade(blank, ["am"]).correct).toBe(false);
  });
  it("대소문자는 가리지 않는다", () => {
    expect(grade(blank, ["AM", "Not"]).correct).toBe(true);
  });
  it("오답일 때 모범답안을 돌려준다", () => {
    expect(grade(blank, ["is"]).expected).toBe("am not");
  });
});

describe("채점 — 축약형", () => {
  it("do not 자리에 don't 를 써도 정답", () => {
    const q = { type: "blank", answer: ["do", "not"] };
    expect(grade(q, ["don't"]).correct).toBe(true);
  });
  it("don't 자리에 do not 을 써도 정답", () => {
    const q = { type: "blank", answer: ["don't"] };
    expect(grade(q, ["do", "not"]).correct).toBe(true);
  });
  it("굽은 따옴표도 같은 것으로 본다", () => {
    const q = { type: "typing", answer: ["I", "don't", "know", "."] };
    expect(grade(q, "I don’t know.").correct).toBe(true);
  });
  it("does not 는 do not 과 다르다", () => {
    const q = { type: "blank", answer: ["do", "not"] };
    expect(grade(q, ["does", "not"]).correct).toBe(false);
  });
});

describe("채점 — accept 로 적은 대안", () => {
  const q = { type: "typing", answer: ["He", "is", "tall", "."], accept: [["He", "'s", "tall", "."]] };
  it("본 정답", () => expect(grade(q, "He is tall.").correct).toBe(true));
  it("대안 정답", () => expect(grade(q, "He 's tall.").correct).toBe(true));
  it("그 밖은 오답", () => expect(grade(q, "He are tall.").correct).toBe(false));
});

describe("채점 — 타이핑", () => {
  const q = { type: "typing", answer: ["She", "studies", "English", "every", "day", "."] };
  it("띄어쓰기가 달라도 정답", () => {
    expect(grade(q, "  She   studies English  every day . ").correct).toBe(true);
  });
  it("마침표를 붙여 써도 정답", () => {
    expect(grade(q, "She studies English every day.").correct).toBe(true);
  });
  it("단어가 틀리면 오답", () => {
    expect(grade(q, "She study English every day.").correct).toBe(false);
  });
});

describe("채점 — 어법 선택", () => {
  const q = { type: "choice", choices: ["go", "goes"], correct: 1, sentence: ["He", null, "to school", "."] };
  it("맞는 인덱스", () => expect(grade(q, 1).correct).toBe(true));
  it("틀린 인덱스", () => expect(grade(q, 0).correct).toBe(false));
  it("고르지 않으면 오답", () => expect(grade(q, null).correct).toBe(false));
});

describe("채점 — 오류 찾기", () => {
  const q = { type: "error", tokens: ["He", "go", "to", "school", "."], wrongIndex: 1, fix: "goes" };
  it("자리와 고친 형태가 모두 맞아야 정답", () => {
    expect(grade(q, { index: 1, fix: "goes" }).correct).toBe(true);
  });
  it("자리는 맞고 고친 형태가 틀리면 오답", () => {
    const r = grade(q, { index: 1, fix: "went" });
    expect(r.correct).toBe(false);
    expect(r.pickedRight).toBe(true);
  });
  it("자리가 틀리면 오답", () => {
    expect(grade(q, { index: 0, fix: "goes" }).correct).toBe(false);
  });
});

describe("보조 함수", () => {
  it("tokenize 는 문장부호를 떼어 낸다", () => {
    expect(tokenize("Hello, world.")).toEqual(["Hello", ",", "world", "."]);
  });
  it("fullSentence 는 prefix+answer+suffix 를 잇는다", () => {
    expect(fullSentence(blank)).toBe("I am not a student .");
  });
  it("joinTokens 는 문장부호 앞 공백을 없앤다", () => {
    expect(joinTokens(["I", "am", "here", "."])).toBe("I am here.");
  });
  it("normSentence 는 축약형을 편 형태로 통일한다", () => {
    expect(normSentence(["I'm", "not", "sure"])).toBe(normSentence(["I", "am", "not", "sure"]));
  });
});
