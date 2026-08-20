// 홈 — PART 목차.
//
// 스크롤 없이 한 화면에 들어오는 것이 목표다. PART 는 한 줄로 접혀 있고,
// 펼치면 챕터가 소주제별로 묶인 칩으로 깔린다.
import { useMemo } from "react";
import { MANIFEST, SECTIONS } from "../content/index.js";
import { Icon } from "../components/Icon.jsx";
import { getPrefs, setPref } from "../engine/storage.js";

const COLLAPSED_KEY = "collapsedSections";

/** 같은 group 끼리 묶는다. group 이 없는 챕터들은 이어지는 대로 한 줄에 붙인다. */
function groupChapters(items) {
  const rows = [];
  for (const meta of items) {
    const last = rows[rows.length - 1];
    if (meta.group) {
      if (last?.group === meta.group) last.items.push(meta);
      else rows.push({ group: meta.group, items: [meta] });
    } else {
      if (last && !last.group) last.items.push(meta);
      else rows.push({ group: null, items: [meta] });
    }
  }
  return rows;
}

export function HomeScreen({ progress, weak, onOpenChapter, onOpenGrammar, onWrongNote, onStats }) {
  const collapsed = getPrefs()[COLLAPSED_KEY] ?? SECTIONS.map((s) => s.id);
  const isCollapsed = (id) => collapsed.includes(id);
  const toggle = (id) =>
    setPref(COLLAPSED_KEY, isCollapsed(id) ? collapsed.filter((x) => x !== id) : [...collapsed, id]);

  const total = MANIFEST.length;
  const completed = MANIFEST.filter((m) => progress[m.id]?.completed).length;

  const sections = useMemo(
    () =>
      SECTIONS.map((sec) => {
        const items = MANIFEST.filter((m) => m.sectionId === sec.id);
        return { ...sec, items, rows: groupChapters(items) };
      }).filter((s) => s.items.length > 0),
    []
  );

  return (
    <div className="fade-in">
      <div className="home-progress">
        <span className="home-progress-num">{completed}<span> / {total}</span></span>
        <span className="home-progress-bar">
          <span className="home-progress-fill" style={{ width: (total ? (completed / total) * 100 : 0) + "%" }} />
        </span>
      </div>

      <div className="quick-actions">
        <button className="quick-card" onClick={onWrongNote}>
          <Icon name="target" size={16} />
          <span>오답노트</span>
          {weak > 0 && <span className="quick-badge">{weak}</span>}
        </button>
        <button className="quick-card" onClick={onOpenGrammar}>
          <Icon name="search" size={16} />
          <span>모아보기</span>
        </button>
        <button className="quick-card" onClick={onStats}>
          <Icon name="chart" size={16} />
          <span>통계</span>
        </button>
      </div>

      <div className="part-list">
        {sections.map((sec) => {
          const folded = isCollapsed(sec.id);
          const done = sec.items.filter((m) => progress[m.id]?.completed).length;
          return (
            <div className={"part" + (folded ? "" : " open")} key={sec.id}>
              <button
                type="button"
                className="part-head"
                onClick={() => toggle(sec.id)}
                aria-expanded={!folded}
              >
                <span className="part-roman">{sec.roman}</span>
                <span className="part-name">{sec.name}</span>
                <span className="part-count">{done}/{sec.items.length}</span>
                <span className="part-caret" aria-hidden="true">{folded ? "▸" : "▾"}</span>
              </button>

              {!folded && (
                <div className="part-body">
                  {sec.rows.map((row, i) => (
                    <div className="chip-row" key={i}>
                      {row.group && <span className="chip-row-label">{row.group}</span>}
                      <div className="chip-list">
                        {row.items.map((meta) => (
                          <button
                            key={meta.id}
                            className={"chip" + (progress[meta.id]?.completed ? " done" : "") + (meta.kind === "basic" ? "" : " sum")}
                            onClick={() => onOpenChapter(meta.id)}
                            title={meta.title}
                          >
                            {meta.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
