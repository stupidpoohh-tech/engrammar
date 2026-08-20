// 챕터 표지 — 문법 요약을 읽고 퀴즈로 들어가는 화면.
import { MANIFEST, sectionById } from "../content/index.js";
import { Blocks } from "../lib/blocks.jsx";
import { Icon } from "../components/Icon.jsx";
import { BackButton, KindTag } from "../components/common.jsx";
import { MODES } from "../engine/variants.js";

/**
 * 챕터 번호는 홈 목차와 같은 규칙으로 센다 — 소속 PART 안에서 basic 챕터만 1부터.
 * (구버전은 홈이 PART 안 번호를, 상세가 전체 통짜 번호를 보여줘 같은 챕터가 두 번호를 가졌다.)
 */
export function chapterLabel(chapterId) {
  const meta = MANIFEST.find((m) => m.id === chapterId);
  if (!meta) return null;
  const sec = sectionById(meta.sectionId);
  if (meta.kind !== "basic") return { roman: sec.roman, text: meta.kind === "mega" ? "MASTER" : "REVIEW" };
  let n = 0;
  for (const m of MANIFEST) {
    if (m.sectionId !== meta.sectionId) continue;
    if (m.kind === "basic") n += 1;
    if (m.id === chapterId) break;
  }
  return { roman: sec.roman, text: `Chapter ${String(n).padStart(2, "0")}` };
}

export function ChapterDetailScreen({ chapter, progress, mode, onSetMode, onBack, onStart, onOpenGrammar }) {
  const label = chapterLabel(chapter.id);
  const best = progress?.best;

  return (
    <div className="fade-in">
      <div className="screen-head">
        <BackButton onClick={onBack} label="챕터 목록" />
      </div>

      <div style={{ padding: "24px 0 16px" }}>
        <div className="chapter-eyebrow">
          <span>{label?.roman}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{label?.text}</span>
          <KindTag kind={chapter.kind} />
        </div>
        <h1 className="screen-title">{chapter.title}</h1>
        {chapter.blurb && <p className="screen-sub" style={{ marginBottom: 12 }}>{chapter.blurb}</p>}
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {chapter.questions.length}문제
          <span style={{ opacity: 0.4, margin: "0 8px" }}>·</span>
          {progress?.completed ? "✓ 완료" : "미완료"}
          {best && (
            <>
              <span style={{ opacity: 0.4, margin: "0 8px" }}>·</span>
              최고 기록 <b style={{ color: "var(--text)" }}>{best.score}/{best.total}</b>
            </>
          )}
        </div>
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
