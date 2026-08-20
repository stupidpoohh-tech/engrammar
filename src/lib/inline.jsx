// 인라인 마크업 렌더러.
//
// 콘텐츠의 text 필드에는 <b> <code> <s> <u> <br> 만 쓸 수 있다.
// 여기서 직접 토큰으로 쪼개 React 엘리먼트를 만들기 때문에
// 앱 어디에도 dangerouslySetInnerHTML 이 없다 — 콘텐츠가 마크업을 주입할 경로가 없다.
//
// 아는 태그가 아니면 그냥 글자로 보여준다. 조용히 삼키지 않는다.

const TAG = /<(\/?)(b|code|s|u|br)\s*\/?>/gi;

const WRAP = {
  b: (key, kids) => <b key={key}>{kids}</b>,
  code: (key, kids) => <code key={key}>{kids}</code>,
  s: (key, kids) => <s key={key}>{kids}</s>,
  u: (key, kids) => <u key={key}>{kids}</u>,
};

export function Inline({ text }) {
  return <>{parseInline(text ?? "")}</>;
}

export function parseInline(text) {
  // 스택 최상단이 현재 열려 있는 태그의 자식 목록
  const root = [];
  const stack = [{ tag: null, kids: root }];
  let last = 0;
  let key = 0;

  const push = (node) => stack[stack.length - 1].kids.push(node);
  const pushText = (s) => { if (s) push(s); };

  for (const m of text.matchAll(TAG)) {
    pushText(text.slice(last, m.index));
    last = m.index + m[0].length;
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();

    if (tag === "br") { push(<br key={"br" + key++} />); continue; }

    if (!closing) {
      stack.push({ tag, kids: [] });
    } else {
      // 짝이 맞는 여는 태그가 없으면 마크업이 아니라 글자로 취급한다
      const top = stack[stack.length - 1];
      if (top.tag !== tag) { pushText(m[0]); continue; }
      stack.pop();
      push(WRAP[tag]("t" + key++, top.kids));
    }
  }
  pushText(text.slice(last));

  // 닫히지 않은 태그가 남았으면 그 내용만 펼쳐서 살린다
  while (stack.length > 1) {
    const top = stack.pop();
    stack[stack.length - 1].kids.push(...top.kids);
  }
  return root;
}

/** 검색 인덱스·읽어주기용 순수 텍스트. */
export function plainText(text) {
  return (text ?? "").replace(TAG, (m) => (m.toLowerCase().startsWith("<br") ? " " : "")).trim();
}
