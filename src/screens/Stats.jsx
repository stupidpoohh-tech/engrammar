// 학습 통계 — 어느 단원이 약한지 한눈에.
import { MANIFEST, SECTIONS } from "../content/index.js";
import { sectionStats } from "../engine/review.js";
import { getItems } from "../engine/storage.js";
import { IconButton } from "../components/common.jsx";

export function StatsScreen({ chapters, progress, onBack, onOpenChapter }) {
  const items = getItems();
  const answered = Object.values(items);
  const right = answered.reduce((n, s) => n + s.right, 0);
  const wrong = answered.reduce((n, s) => n + s.wrong, 0);
  const accuracy = right + wrong > 0 ? Math.round((right / (right + wrong)) * 100) : null;

  const totalQuestions = MANIFEST.reduce((n, m) => n + m.count, 0);
  const done = MANIFEST.filter((m) => progress[m.id]?.completed).length;

  const perSection = sectionStats(chapters);

  return (
    <div className="fade-in">
      <div className="screen-head">
        <IconButton name="home" label="홈으로" onClick={onBack} />
      </div>
      <h1 className="screen-title">학습 통계</h1>
      <p className="screen-sub">모든 기록은 이 브라우저에만 저장됩니다.</p>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-tile-label">완료한 챕터</div>
          <div className="stat-tile-value">{done}<small> / {MANIFEST.length}</small></div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">풀어본 문항</div>
          <div className="stat-tile-value">{answered.length}<small> / {totalQuestions}</small></div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">전체 정답률</div>
          <div className="stat-tile-value">{accuracy === null ? "—" : <>{accuracy}<small>%</small></>}</div>
        </div>
      </div>

      <div className="section-title">단원별 정답률</div>
      <div className="card" style={{ padding: "6px 18px" }}>
        {SECTIONS.map((sec) => {
          const s = perSection.find((x) => x.sectionId === sec.id);
          const pct = s?.accuracy === null || s?.accuracy === undefined ? null : Math.round(s.accuracy * 100);
          const level = pct === null ? "" : pct < 60 ? " low" : pct < 80 ? " mid" : "";
          return (
            <div className="part-stat" key={sec.id}>
              <div className="part-stat-name">
                <span>{sec.roman}</span>
                {sec.name}
              </div>
              <div className="part-stat-bar">
                <div className={"part-stat-fill" + level} style={{ width: (pct ?? 0) + "%" }} />
              </div>
              <div className="part-stat-num">{pct === null ? "—" : pct + "%"}</div>
            </div>
          );
        })}
      </div>

      <WeakChapters chapters={chapters} onOpenChapter={onOpenChapter} />
    </div>
  );
}

/** 정답률이 낮은 챕터 다섯 개 — 바로 다시 풀러 갈 수 있게. */
function WeakChapters({ chapters, onOpenChapter }) {
  const items = getItems();
  const rows = chapters
    .map((c) => {
      let right = 0, wrong = 0;
      for (const q of c.questions) {
        const s = items[`${c.id}/${q.id}`];
        if (s) { right += s.right; wrong += s.wrong; }
      }
      return { c, right, wrong, total: right + wrong };
    })
    .filter((r) => r.total >= 3)
    .sort((a, b) => a.right / a.total - b.right / b.total)
    .slice(0, 5)
    .filter((r) => r.right / r.total < 0.9);

  if (!rows.length) return null;

  return (
    <>
      <div className="section-title">다시 보면 좋을 챕터</div>
      <div className="card" style={{ padding: "6px 18px" }}>
        {rows.map(({ c, right, total }) => (
          <div className="part-stat" key={c.id}>
            <button className="part-stat-name" style={{ textAlign: "left" }} onClick={() => onOpenChapter(c.id)}>
              {c.title}
            </button>
            <div className="part-stat-num">{Math.round((right / total) * 100)}%</div>
          </div>
        ))}
      </div>
    </>
  );
}
