// 홈 — 책 목차 스타일 챕터 목록.
//
// 큰 콘텐츠 청크를 기다리지 않고 manifest 만으로 즉시 그린다.
import { useMemo } from "react";
import { MANIFEST, SECTIONS } from "../content/index.js";
import { ChapterRow } from "../components/ChapterRow.jsx";
import { Icon } from "../components/Icon.jsx";
import { getPrefs, setPref } from "../engine/storage.js";

const COLLAPSED_KEY = "collapsedSections";

export function HomeScreen({ progress, weak, onOpenChapter, onOpenGrammar, onReview, onWrongNote, onStats }) {
  // 처음 오면 PART 목차만 보이도록 전부 접어 둔다
  const collapsed = getPrefs()[COLLAPSED_KEY] ?? SECTIONS.map((s) => s.id);
  const isCollapsed = (id) => collapsed.includes(id);
  const toggle = (id) =>
    setPref(COLLAPSED_KEY, isCollapsed(id) ? collapsed.filter((x) => x !== id) : [...collapsed, id]);

  const total = MANIFEST.length;
  const completed = MANIFEST.filter((m) => progress[m.id]?.completed).length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  const sections = useMemo(
    () =>
      SECTIONS.map((sec) => {
        let n = 0;
        const items = MANIFEST.filter((m) => m.sectionId === sec.id).map((meta) => {
          if (meta.kind === "basic") n += 1;
          return { meta, displayNum: n };
        });
        return { ...sec, items };
      }).filter((s) => s.items.length > 0),
    []
  );

  return (
    <div className="fade-in">
      <div className="home-header">
        <h1 className="home-title">오늘은 어떤 문법을<br />공부해 볼까요?</h1>
        <p className="home-subtitle">
          한국어 문장을 보고 영어 카드를 골라 문장을 완성하는 방식이에요.
        </p>

        <div className="home-progress">
          <div className="home-progress-text">
            <div className="home-progress-num">
              {completed}<span> / {total}</span>
            </div>
            <div className="home-progress-label">전체 진행</div>
          </div>
          <div className="home-progress-bar">
            <div className="home-progress-fill" style={{ width: pct + "%" }} />
          </div>
        </div>

        <div className="quick-actions">
          <button className={"quick-card" + (weak > 0 ? " warn" : "")} onClick={onReview} disabled={weak === 0}>
            <span className="quick-card-mark"><Icon name="refresh" size={18} /></span>
            <span className="quick-card-body">
              <span className="quick-card-title">틀린 문제 복습</span>
              <span className="quick-card-meta">
                {weak > 0 ? `${weak}문제 대기` : "복습할 문제 없음"}
              </span>
            </span>
          </button>
          <button className="quick-card" onClick={onWrongNote}>
            <span className="quick-card-mark"><Icon name="target" size={18} /></span>
            <span className="quick-card-body">
              <span className="quick-card-title">오답노트</span>
              <span className="quick-card-meta">다시 볼 문제</span>
            </span>
          </button>
          <button className="quick-card" onClick={onOpenGrammar}>
            <span className="quick-card-mark"><Icon name="search" size={18} /></span>
            <span className="quick-card-body">
              <span className="quick-card-title">문법 모아보기</span>
              <span className="quick-card-meta">{total}챕터 검색</span>
            </span>
          </button>
          <button className="quick-card" onClick={onStats}>
            <span className="quick-card-mark"><Icon name="chart" size={18} /></span>
            <span className="quick-card-body">
              <span className="quick-card-title">학습 통계</span>
              <span className="quick-card-meta">단원별 정답률</span>
            </span>
          </button>
        </div>
      </div>

      {sections.map((sec) => {
        const folded = isCollapsed(sec.id);
        const done = sec.items.filter(({ meta }) => progress[meta.id]?.completed).length;
        return (
          <div className={"section" + (folded ? " collapsed" : "")} key={sec.id}>
            <button
              type="button"
              className="section-head section-head-toggle"
              onClick={() => toggle(sec.id)}
              aria-expanded={!folded}
            >
              <span className="section-head-line">
                <span className="section-roman">{sec.roman}</span>
                <h2 className="section-name">{sec.name}</h2>
                <span className="section-count">{done}/{sec.items.length}</span>
                <span className="section-toggle-icon" aria-hidden="true">{folded ? "▸" : "▾"}</span>
              </span>
              <span className="section-desc">{sec.desc}</span>
            </button>
            {!folded && (
              <div className="chapter-list">
                {sec.items.map(({ meta, displayNum }) => (
                  <ChapterRow
                    key={meta.id}
                    meta={meta}
                    progress={progress[meta.id]}
                    displayNum={displayNum}
                    onClick={() => onOpenChapter(meta.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
