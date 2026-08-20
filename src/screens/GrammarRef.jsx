// 문법 모아보기 — 검색 + PART별 목차 + 본문.
//
// 구버전은 검색이 없어 65챕터를 눈으로 훑어야 했고, 주소가 항상 #/grammar 라
// 특정 문법을 링크로 보낼 수 없었다. 여기서는 #/grammar/:id 로 챕터마다 주소가 있다.
import { useEffect, useMemo, useRef, useState } from "react";
import { SECTIONS } from "../content/index.js";
import { search } from "../lib/search.js";
import { Blocks } from "../lib/blocks.jsx";
import { Icon } from "../components/Icon.jsx";
import { IconButton, ScreenHeader, KindTag, EmptyNote } from "../components/common.jsx";
import { getPrefs, setPref } from "../engine/storage.js";
import { chapterLabel } from "./ChapterDetail.jsx";

const REF_COLLAPSED = "refCollapsed";

export function GrammarRefScreen({ chapters, activeId, onSelect, onBack, onQuiz }) {
  const [query, setQuery] = useState("");
  const active = chapters.find((c) => c.id === activeId) ?? chapters[0];
  const contentRef = useRef(null);
  const firstRender = useRef(true);

  const grouped = useMemo(
    () => SECTIONS.map((sec) => ({ ...sec, items: chapters.filter((c) => c.sectionId === sec.id) }))
      .filter((s) => s.items.length),
    [chapters]
  );

  const activeSectionId = grouped.find((s) => s.items.some((c) => c.id === active?.id))?.id;

  // 처음 열면 지금 보고 있는 챕터가 속한 PART 만 펼쳐 둔다
  // 처음 열면 모두 접혀 있다 — 65챕터가 한꺼번에 펼쳐지지 않게
  const collapsed = getPrefs()[REF_COLLAPSED] ?? grouped.map((s) => s.id);
  const toggle = (id) =>
    setPref(REF_COLLAPSED, collapsed.includes(id) ? collapsed.filter((x) => x !== id) : [...collapsed, id]);

  const results = useMemo(() => (query.trim() ? search(chapters, query) : null), [chapters, query]);

  // 주소로 바로 들어온 첫 화면에서는 스크롤을 건드리지 않는다
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeId]);

  return (
    <div className="fade-in">
      <ScreenHeader
        title="문법 모아보기"
        action={<IconButton name="home" label="홈으로" onClick={onBack} />}
      >
        <div className="search-bar">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="관계대명사, have p.p, 가정법…"
            aria-label="문법 검색"
            type="search"
            autoComplete="off"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="검색어 지우기">
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      </ScreenHeader>

      {results ? (
        <SearchResults results={results} query={query} onSelect={(id) => { setQuery(""); onSelect(id); }} />
      ) : (
        <>
          <div className="grammar-ref-nav" style={{ marginTop: 20 }}>
            {grouped.map((sec) => {
              const folded = collapsed.includes(sec.id);
              return (
                <div className={"ref-section" + (sec.id === activeSectionId ? " has-active" : "")} key={sec.id}>
                  <button type="button" className="ref-section-head" onClick={() => toggle(sec.id)} aria-expanded={!folded}>
                    <span className="ref-section-roman">{sec.roman}</span>
                    <span className="ref-section-name">{sec.name}</span>
                    <span className="ref-section-icon">{folded ? "▸" : "▾"}</span>
                  </button>
                  {!folded && (
                    <div className="ref-section-items">
                      {sec.items.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => onSelect(ch.id)}
                          className={"ref-chapter-btn" + (ch.id === active?.id ? " active" : "")}
                        >
                          {ch.kind === "review" && <span className="ref-kind-mark review">정리</span>}
                          {ch.kind === "mega" && <span className="ref-kind-mark mega">마스터</span>}
                          <span className="ref-chapter-title">{ch.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {active && (
            <div id="grammar-ref-content" ref={contentRef} style={{ marginTop: 32 }}>
              <div className="chapter-eyebrow">
                <span>{chapterLabel(active.id)?.roman}</span>
                <KindTag kind={active.kind} />
              </div>
              <h2 className="ref-content-title">{active.title}</h2>
              <Blocks blocks={active.summary} />
              <button className="ref-jump" onClick={() => onQuiz(active.id)}>
                <Icon name="pencil" size={14} /> 이 문법으로 퀴즈 풀기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchResults({ results, query, onSelect }) {
  if (!results.length) {
    return <EmptyNote>『{query}』에 해당하는 문법을 찾지 못했어요.<br />다른 말로 검색해 보세요.</EmptyNote>;
  }
  return (
    <>
      <div className="search-meta">{results.length}개 챕터에서 찾았어요</div>
      <div className="search-results">
        {results.map(({ chapter, snippet }) => (
          <button key={chapter.id} className="search-result" onClick={() => onSelect(chapter.id)}>
            <div className="search-result-head">
              <span className="search-result-part">{chapterLabel(chapter.id)?.roman}</span>
              <span>{chapter.title}</span>
              <KindTag kind={chapter.kind} />
            </div>
            {snippet && (
              <div className="search-snippet">
                {snippet.before}<mark>{snippet.match}</mark>{snippet.after}
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
