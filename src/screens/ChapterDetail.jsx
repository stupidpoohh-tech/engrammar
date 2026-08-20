// 챕터 표지 — 문법 요약을 읽고 퀴즈로 들어가는 화면.
import { MANIFEST, sectionById } from "../content/index.js";
import { Blocks } from "../lib/blocks.jsx";
import { Icon } from "../components/Icon.jsx";
import { IconButton } from "../components/common.jsx";
import { MODES } from "../engine/variants.js";

/** 챕터 번호는 소속 PART 안에서 1부터 센다 — "Part I. Ch5". */
export function chapterLabel(chapterId) {
  const meta = MANIFEST.find((m) => m.id === chapterId);
  if (!meta) return null;
  const sec = sectionById(meta.sectionId);
  const roman = sec.roman.replace("PART", "Part");
  let n = 0;
  for (const m of MANIFEST) {
    if (m.sectionId !== meta.sectionId) continue;
    n += 1;
    if (m.id === chapterId) break;
  }
  return { roman: sec.roman, text: `${roman}. Ch${n}` };
}

export function ChapterDetailScreen({ chapter, progress, mode, onSetMode, onBack, onStart, onOpenGrammar }) {
  const label = chapterLabel(chapter.id);

  return (
    <div className="fade-in">
      <div className="screen-head">
        <IconButton name="arrow-left" label="챕터 목록으로" onClick={onBack} />
      </div>

      <div className="chapter-title-block">
        <span className="chapter-eyebrow">{label?.text}</span>
        <h1 className="screen-title">
          {chapter.title}
          <span
            className={"chapter-done" + (progress?.completed ? " on" : "")}
            title={progress?.completed ? "완료" : "미완료"}
          >
            <Icon name="check" size={12} />
          </span>
        </h1>
      </div>

      <Blocks blocks={chapter.summary} />

      <div className="chapter-start">
        <div className="mode-picker">
          <div className="mode-picker-row">
            <span className="mode-picker-label">푸는 방식</span>
            <div className="mode-toggle" role="group" aria-label="푸는 방식">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  className={mode === m.id ? "on" : ""}
                  onClick={() => onSetMode(m.id)}
                  aria-pressed={mode === m.id}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <p className="mode-picker-desc">{MODES.find((m) => m.id === mode)?.desc}</p>
        </div>

        <button className="btn btn-primary btn-lg btn-block" onClick={onStart}>
          {progress?.completed ? "다시 풀어보기" : "퀴즈 시작하기"} →
        </button>
        <button className="ref-jump" onClick={() => onOpenGrammar(chapter.id)} style={{ marginTop: 14 }}>
          <Icon name="book" size={14} /> 이 챕터의 문법을 모아보기에서 열기
        </button>
      </div>
    </div>
  );
}
