import { describe, expect, it } from "vitest";
import { parseInline, plainText } from "../src/lib/inline.jsx";
import { blocksToText } from "../src/lib/blocks.jsx";

/** React 엘리먼트 트리를 태그 이름만 남긴 문자열로 — DOM 없이 구조를 본다. */
function shape(nodes) {
  return (Array.isArray(nodes) ? nodes : [nodes])
    .map((n) => {
      if (typeof n === "string") return n;
      if (!n?.type) return "";
      const kids = n.props?.children;
      return kids === undefined ? `<${n.type}/>` : `<${n.type}>${shape(kids)}</${n.type}>`;
    })
    .join("");
}

describe("인라인 마크업", () => {
  it("그냥 글자는 그대로", () => {
    expect(shape(parseInline("주어가 I 일 때"))).toBe("주어가 I 일 때");
  });

  it("아는 태그는 엘리먼트로", () => {
    expect(shape(parseInline("be동사는 <b>상태</b>를"))).toBe("be동사는 <b>상태</b>를");
    expect(shape(parseInline("<code>am</code>"))).toBe("<code>am</code>");
  });

  it("중첩도 처리한다", () => {
    expect(shape(parseInline("<b>진한 <code>코드</code></b>"))).toBe("<b>진한 <code>코드</code></b>");
  });

  it("br 은 빈 엘리먼트", () => {
    expect(shape(parseInline("한 줄<br>다음 줄"))).toBe("한 줄<br/>다음 줄");
  });

  // 콘텐츠가 마크업을 주입할 경로를 두지 않는다 — 모르는 태그는 글자로 남는다
  it("모르는 태그는 엘리먼트를 만들지 않는다", () => {
    const out = shape(parseInline('<script>alert(1)</script>'));
    expect(out).toBe("<script>alert(1)</script>");
    expect(parseInline("<img src=x>").every((n) => typeof n === "string")).toBe(true);
  });

  it("짝이 안 맞는 닫는 태그는 글자로 남는다", () => {
    expect(shape(parseInline("hello</b>"))).toBe("hello</b>");
  });

  it("닫히지 않은 태그가 있어도 내용은 살아남는다", () => {
    expect(shape(parseInline("<b>안 닫힘"))).toBe("안 닫힘");
  });
});

describe("검색용 텍스트 뽑기", () => {
  it("plainText 는 태그를 걷어낸다", () => {
    expect(plainText("주어가 <b>I</b>일 때 <code>am</code>")).toBe("주어가 I일 때 am");
  });

  it("blocksToText 는 표와 목록까지 훑는다", () => {
    const blocks = [
      { t: "h", text: "제목" },
      { t: "p", text: "<b>문단</b>" },
      { t: "ul", items: ["첫째", "둘째"] },
      { t: "table", head: ["주어", "동사"], rows: [["I", "<code>am</code>"], [{ text: "합친 칸", span: 2 }]] },
    ];
    const text = blocksToText(blocks);
    for (const word of ["제목", "문단", "첫째", "둘째", "주어", "동사", "am", "합친 칸"]) {
      expect(text).toContain(word);
    }
    expect(text).not.toContain("<");
  });
});
