import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../src/content/all.js";
import { search } from "../src/lib/search.js";

describe("문법 검색", () => {
  it("빈 검색어는 아무것도 내지 않는다", () => {
    expect(search(CHAPTERS, "   ")).toEqual([]);
  });

  it("챕터 제목으로 찾는다", () => {
    const hit = search(CHAPTERS, "관계대명사");
    expect(hit.length).toBeGreaterThan(0);
    expect(hit[0].chapter.title).toContain("관계대명사");
  });

  it("제목에 없어도 본문에서 찾는다", () => {
    const hit = search(CHAPTERS, "p.p");
    expect(hit.length).toBeGreaterThan(0);
  });

  it("예문의 영어로도 찾는다", () => {
    const hit = search(CHAPTERS, "student");
    expect(hit.length).toBeGreaterThan(0);
  });

  it("대소문자를 가리지 않는다", () => {
    expect(search(CHAPTERS, "STUDENT").length).toBe(search(CHAPTERS, "student").length);
  });

  it("여러 낱말은 모두 들어 있어야 한다", () => {
    const both = search(CHAPTERS, "가정법 과거");
    for (const r of both) {
      const hay = JSON.stringify(r.chapter).toLowerCase();
      expect(hay).toContain("가정법");
      expect(hay).toContain("과거");
    }
  });

  it("없는 말은 빈 결과", () => {
    expect(search(CHAPTERS, "존재하지않는문법용어xyz")).toEqual([]);
  });

  it("결과마다 맞은 자리를 잘라 준다", () => {
    const [first] = search(CHAPTERS, "수동태");
    expect(first.snippet.match.toLowerCase()).toBe("수동태");
  });

  it("제목이 맞은 챕터가 위로 온다", () => {
    const hits = search(CHAPTERS, "현재완료");
    expect(hits[0].chapter.title).toContain("현재완료");
  });
});
