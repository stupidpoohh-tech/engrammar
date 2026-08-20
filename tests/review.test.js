import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetStorage } from "./setup-dom.js";

const chapters = [
  {
    id: "ch1", sectionId: "tense", title: "챕터 1", kind: "basic",
    questions: [
      { id: "q1", type: "blank", ko: "가", prefix: ["I"], answer: ["am"], suffix: [], distractors: ["is"], explanation: "설명" },
      { id: "q2", type: "blank", ko: "나", prefix: ["He"], answer: ["is"], suffix: [], distractors: ["am"], explanation: "설명" },
    ],
  },
  {
    id: "ch2", sectionId: "passive", title: "챕터 2", kind: "review",
    questions: [
      { id: "q1", type: "arrange", ko: "다", answer: ["He", "was", "seen"], explanation: "설명" },
    ],
  },
];

async function fresh() {
  resetStorage();
  vi.resetModules();
  const storage = await import("../src/engine/storage.js");
  const review = await import("../src/engine/review.js");
  return { storage, review };
}

describe("오답노트", () => {
  let S, R;
  beforeEach(async () => { ({ storage: S, review: R } = await fresh()); });

  it("비어 있을 때는 아무것도 없다", () => {
    expect(R.weakItems(chapters)).toEqual([]);
    expect(R.weakCount()).toBe(0);
  });

  it("틀린 문항만 담긴다", () => {
    S.recordAnswer("ch1", "q1", false);
    S.recordAnswer("ch1", "q2", true);
    const weak = R.weakItems(chapters);
    expect(weak.map((w) => w.question.id)).toEqual(["q1"]);
    expect(R.weakCount()).toBe(1);
  });

  it("여러 챕터에 걸쳐 모인다", () => {
    S.recordAnswer("ch1", "q1", false);
    S.recordAnswer("ch2", "q1", false);
    expect(R.weakItems(chapters).map((w) => w.chapterId)).toEqual(["ch1", "ch2"]);
  });

  it("숙달되면 빠진다", () => {
    S.recordAnswer("ch1", "q1", false);
    for (let i = 0; i < S.MASTER_BOX; i++) S.recordAnswer("ch1", "q1", true);
    expect(R.weakItems(chapters)).toEqual([]);
  });

  it("더 약한 문항이 앞에 온다", () => {
    S.recordAnswer("ch1", "q1", false);
    S.recordAnswer("ch1", "q1", true);   // box 1
    S.recordAnswer("ch1", "q2", false);  // box 0
    expect(R.weakItems(chapters).map((w) => w.question.id)).toEqual(["q2", "q1"]);
  });

  it("복습 세션은 개수를 제한한다", () => {
    S.recordAnswer("ch1", "q1", false);
    S.recordAnswer("ch1", "q2", false);
    S.recordAnswer("ch2", "q1", false);
    expect(R.buildReviewItems(chapters, 2).length).toBe(2);
    expect(R.buildReviewItems(chapters, 2)[0]).toHaveProperty("question.id");
  });

  it("사라진 문항의 기록은 무시한다", () => {
    S.recordAnswer("없는챕터", "q9", false);
    expect(R.weakItems(chapters)).toEqual([]);
  });
});

describe("단원별 통계", () => {
  it("정답률을 낸다", async () => {
    const { storage: S, review: R } = await fresh();
    S.recordAnswer("ch1", "q1", true);
    S.recordAnswer("ch1", "q1", true);
    S.recordAnswer("ch1", "q2", false);
    const tense = R.sectionStats(chapters).find((s) => s.sectionId === "tense");
    expect(tense.right).toBe(2);
    expect(tense.wrong).toBe(1);
    expect(tense.accuracy).toBeCloseTo(2 / 3);
  });

  it("풀지 않은 단원은 정답률이 없다", async () => {
    const { review: R } = await fresh();
    const passive = R.sectionStats(chapters).find((s) => s.sectionId === "passive");
    expect(passive.accuracy).toBeNull();
  });
});
