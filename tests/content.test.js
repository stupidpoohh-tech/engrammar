import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../src/content/all.js";
import { validateChapters, QUESTION_TYPES } from "../src/content/schema.js";
import { MANIFEST } from "../src/content/manifest.js";
import { SECTIONS } from "../src/content/sections.js";
import { fullSentence } from "../src/engine/grading.js";

describe("콘텐츠 스키마", () => {
  it("모든 챕터가 형식을 지킨다", () => {
    expect(validateChapters(CHAPTERS)).toEqual([]);
  });

  it("챕터 id 가 겹치지 않는다", () => {
    const ids = CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 챕터에 문항이 있다", () => {
    for (const c of CHAPTERS) expect(c.questions.length).toBeGreaterThan(0);
  });

  it("모든 문항에 문법 설명이 붙어 있다", () => {
    for (const c of CHAPTERS) {
      for (const q of c.questions) expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it("아는 유형만 쓴다", () => {
    for (const c of CHAPTERS) {
      for (const q of c.questions) expect(QUESTION_TYPES).toContain(q.type);
    }
  });
});

describe("카드 문항의 함정", () => {
  // 구버전에서 55건 있었다 — 화면에 똑같은 카드가 두 장 떴다
  it("정답 단어가 오답 카드에 들어 있지 않다", () => {
    const bad = [];
    for (const c of CHAPTERS) {
      for (const q of c.questions) {
        if (q.type !== "blank") continue;
        const lower = q.distractors.map((d) => d.toLowerCase());
        for (const a of q.answer) if (lower.includes(a.toLowerCase())) bad.push(`${c.id}/${q.id}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("오답 카드끼리도 겹치지 않는다", () => {
    const bad = [];
    for (const c of CHAPTERS) {
      for (const q of c.questions) {
        const lower = (q.distractors ?? []).map((d) => d.toLowerCase());
        if (new Set(lower).size !== lower.length) bad.push(`${c.id}/${q.id}`);
      }
    }
    expect(bad).toEqual([]);
  });

  // 카드 한 장의 길이가 정답만 유난히 길면 읽지 않고도 고를 수 있다.
  // (여러 장으로 나뉜 정답은 해당 없음 — 장수가 아니라 장당 길이가 문제다)
  it("가장 긴 정답 카드가 가장 긴 오답 카드보다 길지 않다", () => {
    const words = (s) => s.trim().split(/\s+/).length;
    const bad = [];
    for (const c of CHAPTERS) {
      for (const q of c.questions) {
        if (q.type !== "blank" || !q.distractors.length) continue;
        const longestAnswer = Math.max(...q.answer.map(words));
        const longestDistractor = Math.max(...q.distractors.map(words));
        if (longestAnswer > longestDistractor) bad.push(`${c.id}/${q.id}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("목차 칩", () => {
  it("모든 챕터에 짧은 이름이 있다", () => {
    for (const c of CHAPTERS) {
      expect(c.short?.trim().length ?? 0).toBeGreaterThan(0);
      expect(c.short.length).toBeLessThanOrEqual(12);
    }
  });

  it("같은 PART 안에서 짧은 이름이 겹치지 않는다", () => {
    const bad = [];
    for (const sec of SECTIONS) {
      const items = CHAPTERS.filter((c) => c.sectionId === sec.id);
      // 소주제(group)가 다르면 같은 이름이어도 된다 — "과거/be동사" 와 "미래/be동사"
      const keys = items.map((c) => `${c.group ?? ""}/${c.short}`);
      if (new Set(keys).size !== keys.length) bad.push(sec.id);
    }
    expect(bad).toEqual([]);
  });

  // 흩어져 있으면 목차에 같은 줄이 두 번 그려진다
  it("같은 소주제는 배열에서 붙어 있다", () => {
    const seen = new Set();
    let prev = null;
    const bad = [];
    for (const c of CHAPTERS) {
      const key = `${c.sectionId}/${c.group ?? ""}`;
      if (key !== prev) {
        if (c.group && seen.has(key)) bad.push(key);
        seen.add(key);
        prev = key;
      }
    }
    expect(bad).toEqual([]);
  });

  it("manifest 가 짧은 이름과 소주제를 함께 담는다", () => {
    for (const [i, m] of MANIFEST.entries()) {
      expect(m.short).toBe(CHAPTERS[i].short);
      expect(m.group).toBe(CHAPTERS[i].group ?? null);
    }
  });
});

describe("구성", () => {
  it("manifest 가 콘텐츠와 일치한다", () => {
    expect(MANIFEST.length).toBe(CHAPTERS.length);
    for (const [i, m] of MANIFEST.entries()) {
      expect(m.id).toBe(CHAPTERS[i].id);
      expect(m.count).toBe(CHAPTERS[i].questions.length);
      expect(m.title).toBe(CHAPTERS[i].title);
      expect(m.kind).toBe(CHAPTERS[i].kind);
    }
  });

  it("모든 챕터가 정의된 PART 에 속한다", () => {
    const ids = new Set(SECTIONS.map((s) => s.id));
    for (const c of CHAPTERS) expect(ids.has(c.sectionId)).toBe(true);
  });

  it("PART 마다 챕터가 있고 정리 챕터로 끝난다", () => {
    for (const sec of SECTIONS) {
      const items = CHAPTERS.filter((c) => c.sectionId === sec.id);
      expect(items.length).toBeGreaterThan(0);
      expect(["review", "mega"]).toContain(items.at(-1).kind);
    }
  });

  it("모든 문항에서 완성 문장을 만들 수 있다", () => {
    for (const c of CHAPTERS) {
      for (const q of c.questions) {
        expect(fullSentence(q).trim().length).toBeGreaterThan(0);
      }
    }
  });
});
