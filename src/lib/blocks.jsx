// summary 블록 렌더러. 형식 정의는 src/content/schema.js 참고.
import { Inline, plainText } from "./inline.jsx";

export function Blocks({ blocks }) {
  return (
    <div className="prose">
      {(blocks ?? []).map((b, i) => <Block key={i} b={b} />)}
    </div>
  );
}

function Block({ b }) {
  if (b.t === "h") return <h4><Inline text={b.text} /></h4>;
  if (b.t === "p") return <p><Inline text={b.text} /></p>;
  if (b.t === "ul") {
    return <ul>{b.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ul>;
  }
  if (b.t === "table") {
    return (
      // 표는 좁은 화면에서 자기 안에서만 가로 스크롤한다 — 페이지가 밀리지 않게
      <div className="table-scroll">
        <table>
          {b.head?.length > 0 && (
            <thead><tr>{b.head.map((c, i) => <Cell key={i} c={c} head />)}</tr></thead>
          )}
          <tbody>
            {b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <Cell key={j} c={c} />)}</tr>)}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

function Cell({ c, head }) {
  const text = typeof c === "string" ? c : c.text;
  const span = typeof c === "string" ? undefined : c.span;
  const T = head ? "th" : "td";
  return <T colSpan={span}><Inline text={text} /></T>;
}

/** 블록 배열에서 검색용 텍스트를 뽑는다. */
export function blocksToText(blocks) {
  const cell = (c) => plainText(typeof c === "string" ? c : c.text);
  return (blocks ?? [])
    .map((b) => {
      if (b.t === "h" || b.t === "p") return plainText(b.text);
      if (b.t === "ul") return b.items.map(plainText).join(" ");
      if (b.t === "table") return [...(b.head ?? []), ...b.rows.flat()].map(cell).join(" ");
      return "";
    })
    .join("\n");
}
