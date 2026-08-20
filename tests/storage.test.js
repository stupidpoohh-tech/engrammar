import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetStorage } from "./setup-dom.js";

// 저장소는 모듈 안에 캐시를 두므로 테스트마다 새로 가져온다
async function freshStorage() {
  resetStorage();
  vi.resetModules();
  return import("../src/engine/storage.js");
}

describe("문항 이력", () => {
  let S;
  beforeEach(async () => { S = await freshStorage(); });

  it("맞히면 right 와 box 가 오른다", () => {
    S.recordAnswer("ch", "q1", true);
    expect(S.getItem("ch", "q1")).toMatchObject({ right: 1, wrong: 0, box: 1 });
  });

  it("틀리면 wrong 이 오르고 box 는 0으로 떨어진다", () => {
    S.recordAnswer("ch", "q1", true);
    S.recordAnswer("ch", "q1", true);
    S.recordAnswer("ch", "q1", false);
    expect(S.getItem("ch", "q1")).toMatchObject({ right: 2, wrong: 1, box: 0 });
  });

  it("box 는 MASTER_BOX 를 넘지 않는다", () => {
    for (let i = 0; i < 10; i++) S.recordAnswer("ch", "q1", true);
    expect(S.getItem("ch", "q1").box).toBe(S.MASTER_BOX);
  });

  it("틀린 적 있는 문항은 오답노트에 남는다", () => {
    S.recordAnswer("ch", "q1", false);
    expect(S.weakKeys()).toEqual(["ch/q1"]);
  });

  it("연속으로 MASTER_BOX 번 맞히면 오답노트에서 빠진다", () => {
    S.recordAnswer("ch", "q1", false);
    for (let i = 0; i < S.MASTER_BOX; i++) S.recordAnswer("ch", "q1", true);
    expect(S.weakKeys()).toEqual([]);
  });

  it("한 번도 틀리지 않은 문항은 오답노트에 들어가지 않는다", () => {
    S.recordAnswer("ch", "q1", true);
    expect(S.weakKeys()).toEqual([]);
  });

  it("오답노트에서 지울 수 있다", () => {
    S.recordAnswer("ch", "q1", false);
    S.clearItem("ch", "q1");
    expect(S.weakKeys()).toEqual([]);
  });
});

describe("챕터 진도", () => {
  let S;
  beforeEach(async () => { S = await freshStorage(); });

  it("완료로 기록된다", () => {
    S.recordChapterResult("ch", 6, 8);
    expect(S.getProgress().ch).toMatchObject({ completed: true, best: { score: 6, total: 8 } });
  });

  it("정답률이 더 좋을 때만 최고 기록을 바꾼다", () => {
    S.recordChapterResult("ch", 8, 8);
    S.recordChapterResult("ch", 4, 8);
    expect(S.getProgress().ch.best).toEqual({ score: 8, total: 8 });
  });

  // 구버전은 비율만 봐서 5/5(100%)가 8/8(100%)을 밀어냈다
  it("정답률이 같으면 더 많이 푼 쪽을 남긴다", () => {
    S.recordChapterResult("ch", 5, 5);
    S.recordChapterResult("ch", 8, 8);
    expect(S.getProgress().ch.best).toEqual({ score: 8, total: 8 });
  });
});

describe("내보내기 / 불러오기", () => {
  it("내보낸 기록을 그대로 되살린다", async () => {
    let S = await freshStorage();
    S.recordAnswer("ch", "q1", false);
    S.recordChapterResult("ch", 3, 5);
    const dump = JSON.parse(JSON.stringify(S.exportAll()));

    S = await freshStorage();
    expect(S.weakKeys()).toEqual([]);
    S.importAll(dump);
    expect(S.weakKeys()).toEqual(["ch/q1"]);
    expect(S.getProgress().ch.best).toEqual({ score: 3, total: 5 });
  });

  it("형식이 아니면 거부한다", async () => {
    const S = await freshStorage();
    expect(() => S.importAll(null)).toThrow();
  });

  it("모두 지우기", async () => {
    const S = await freshStorage();
    S.recordAnswer("ch", "q1", false);
    S.resetAll();
    expect(S.weakKeys()).toEqual([]);
    expect(S.getProgress()).toEqual({});
  });
});

describe("구버전 진도 이전", () => {
  it("옛 키의 완료 기록을 옮겨 온다", async () => {
    const S = await freshStorage();
    localStorage.setItem(
      "engquiz.progress.v1",
      JSON.stringify({ "be-aff": { completed: true, score: 8, total: 8, completedAt: 1 } })
    );
    S.migrateLegacy();
    expect(S.getProgress()["be-aff"]).toMatchObject({ completed: true, best: { score: 8, total: 8 } });
  });

  // 구버전 "미리 마치기" 버그로 7/5 같은 기록이 남아 있을 수 있다
  it("100%를 넘는 옛 기록은 잘라서 옮긴다", async () => {
    const S = await freshStorage();
    localStorage.setItem(
      "engquiz.progress.v1",
      JSON.stringify({ ch: { completed: true, score: 7, total: 5 } })
    );
    S.migrateLegacy();
    const best = S.getProgress().ch.best;
    expect(best.score / best.total).toBeLessThanOrEqual(1);
  });

  it("두 번 실행해도 덧씌우지 않는다", async () => {
    const S = await freshStorage();
    localStorage.setItem("engquiz.progress.v1", JSON.stringify({ ch: { completed: true, score: 1, total: 5 } }));
    S.migrateLegacy();
    S.recordChapterResult("ch", 5, 5);
    S.migrateLegacy();
    expect(S.getProgress().ch.best).toEqual({ score: 5, total: 5 });
  });
});
