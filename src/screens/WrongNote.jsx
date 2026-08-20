// 오답노트 — 전 챕터에서 틀렸고 아직 숙달되지 않은 문항.
//
// 구버전에는 이 화면이 없었다. 틀린 문제는 그 세션 안에서만 다시 나오고 사라졌다.
import { weakItems } from "../engine/review.js";
import { fullSentence, joinTokens } from "../engine/grading.js";
import { clearItem, MASTER_BOX } from "../engine/storage.js";
import { Icon } from "../components/Icon.jsx";
import { IconButton, ScreenHeader, BoxMeter, EmptyNote } from "../components/common.jsx";
import { chapterLabel } from "./ChapterDetail.jsx";

export function WrongNoteScreen({ chapters, onBack, onReview, onOpenChapter, refresh }) {
  const items = weakItems(chapters);

  return (
    <div className="fade-in">
      <ScreenHeader
        title="오답노트"
        action={<IconButton name="home" label="홈으로" onClick={onBack} />}
      />
      <p className="screen-sub">
        한 번이라도 틀린 문항이 모입니다. 연속으로 {MASTER_BOX}번 맞히면 목록에서 빠져요.
      </p>

      {items.length === 0 ? (
        <EmptyNote>
          아직 오답노트가 비어 있어요.<br />
          퀴즈를 풀다 틀린 문제가 여기 모입니다.
        </EmptyNote>
      ) : (
        <>
          <button className="btn btn-primary btn-block btn-lg" onClick={onReview}>
            <Icon name="refresh" size={16} /> {Math.min(items.length, 15)}문제 복습 시작
          </button>

          <div className="wrong-list">
            {items.map(({ chapter, question, stat }) => (
              <div className="wrong-row" key={`${chapter.id}/${question.id}`}>
                <div className="wrong-row-body">
                  <div className="wrong-row-ko">{question.ko}</div>
                  <div className="wrong-row-en">{joinTokens([fullSentence(question)])}</div>
                  <div className="wrong-row-meta">
                    <button className="wrong-row-chapter" onClick={() => onOpenChapter(chapter.id)}>
                      {chapterLabel(chapter.id)?.roman} · {chapter.title}
                    </button>
                    <span>틀림 {stat.wrong}회</span>
                    <BoxMeter box={stat.box} />
                  </div>
                </div>
                <button
                  className="btn btn-soft btn-sm"
                  onClick={() => { clearItem(chapter.id, question.id); refresh?.(); }}
                  title="이 문항을 오답노트에서 지웁니다"
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
