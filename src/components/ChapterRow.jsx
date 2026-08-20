import { Icon } from "./Icon.jsx";
import { KindTag } from "./common.jsx";

/** 홈 목차의 한 줄. meta 는 manifest 항목(가벼움) 또는 챕터 자체 둘 다 받는다. */
export function ChapterRow({ meta, progress, displayNum, onClick }) {
  const isReview = meta.kind === "review";
  const isMega = meta.kind === "mega";
  const done = progress?.completed;
  const ratio = progress?.best ? Math.round((progress.best.score / progress.best.total) * 100) : 0;

  const numText = isMega ? "✦" : isReview ? "—" : String(displayNum).padStart(2, "0");

  return (
    <button
      className={
        "chapter-row" +
        (isReview ? " review" : "") +
        (isMega ? " mega" : "") +
        (done ? " completed" : "")
      }
      onClick={onClick}
    >
      <div className="chapter-row-num">{numText}</div>
      <div className="chapter-row-body">
        <div className="chapter-row-title">
          <span>{meta.title}</span>
          <KindTag kind={meta.kind} />
        </div>
        <div className="chapter-row-meta">
          {meta.count}문제
          {meta.blurb && <span className="chapter-row-meta-sep">·</span>}
          {meta.blurb && <span>{meta.blurb}</span>}
        </div>
      </div>
      <div className="chapter-row-status">
        {done ? (
          <span className="chapter-row-check"><Icon name="check" size={11} /></span>
        ) : progress?.best ? (
          <div className="chapter-row-progress">
            <div className="chapter-row-progress-fill" style={{ width: ratio + "%" }} />
          </div>
        ) : (
          <span className="chapter-row-arrow"><Icon name="arrow-right" size={16} /></span>
        )}
      </div>
    </button>
  );
}
