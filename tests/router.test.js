import { describe, expect, it } from "vitest";
import { parseHash, paths } from "../src/lib/router.js";

describe("주소 해석", () => {
  it("빈 주소는 홈", () => {
    for (const h of ["", "#", "#/", undefined]) {
      expect(parseHash(h).head).toBe("home");
    }
  });

  it("화면 이름을 읽는다", () => {
    expect(parseHash("#/wrong")).toMatchObject({ head: "wrong", id: null });
    expect(parseHash("#/stats").head).toBe("stats");
  });

  it("챕터 id 를 읽는다", () => {
    expect(parseHash("#/chapter/be-aff")).toMatchObject({ head: "chapter", id: "be-aff" });
    expect(parseHash("#/grammar/relative-pronoun")).toMatchObject({ head: "grammar", id: "relative-pronoun" });
  });

  it("앞의 슬래시가 없어도 읽는다", () => {
    expect(parseHash("#quiz/be-aff")).toMatchObject({ head: "quiz", id: "be-aff" });
  });

  it("빈 조각은 버린다", () => {
    expect(parseHash("#//chapter//be-aff//")).toMatchObject({ head: "chapter", id: "be-aff" });
  });
});

describe("주소 만들기", () => {
  it("모든 주소가 # 로 시작한다", () => {
    const made = [
      paths.home(), paths.chapter("x"), paths.quiz("x"), paths.review(),
      paths.wrong(), paths.grammar(), paths.grammar("x"), paths.stats(), paths.settings(),
    ];
    for (const p of made) expect(p.startsWith("#/")).toBe(true);
  });

  it("만든 주소를 되읽으면 같은 화면이 나온다", () => {
    expect(parseHash(paths.chapter("be-aff"))).toMatchObject({ head: "chapter", id: "be-aff" });
    expect(parseHash(paths.grammar("what-usage"))).toMatchObject({ head: "grammar", id: "what-usage" });
    expect(parseHash(paths.grammar())).toMatchObject({ head: "grammar", id: null });
    expect(parseHash(paths.home()).head).toBe("home");
  });
});
