// 퀴즈 화면.
//
// 세션 상태는 src/engine/session.js 의 순수 리듀서가 들고 있고, 여기서는 그리기와
// 저장(오답노트 기록)만 한다. 카드 배치는 문항을 볼 때마다 새로 섞인다.
import { useEffect, useMemo, useReducer, useRef } from "react";
import {
  createSession, reducer, currentItem, canSubmit, canFinishEarly,
  sessionScore, EARLY_FINISH_MIN,
} from "../engine/session.js";
import { joinTokens } from "../engine/grading.js";
import { applyMode } from "../engine/variants.js";
import { recordAnswer } from "../engine/storage.js";
import { Inline } from "../lib/inline.jsx";
import { Icon } from "../components/Icon.jsx";
import { ProgressBar } from "../components/common.jsx";

export function QuizScreen({ items, mode, subtitle, onExit, onComplete }) {
  const prepared = useMemo(
    () => items.map((it) => ({ ...it, question: applyMode(it.question, mode) })),
    [items, mode]
  );

  const [state, dispatch] = useReducer(reducer, prepared, (i) => createSession(i));
  const item = currentItem(state);
  const question = item?.question;
  const recorded = useRef(new Set());

  // 채점 결과를 문항 이력에 남긴다. 세션 안의 재시도는 방금 본 답을 다시 친 것이라
  // 숙달로 볼 수 없으므로 기록하지 않는다.
  useEffect(() => {
    if (!state.answered || !item || item.isRetry) return;
    if (recorded.current.has(item.key)) return;
    recorded.current.add(item.key);
    recordAnswer(item.chapterId, item.question.id, state.result.correct);
  }, [state.answered, state.result, item]);

  useEffect(() => {
    if (!state.finished) return;
    const { score, total } = sessionScore(state);
    onComplete({ score, total, maxStreak: state.maxStreak, early: !!state.early });
  }, [state.finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => dispatch({ type: "submit" });
  const next = () => dispatch({ type: "next" });

  useKeyboard(state, question, dispatch, submit, next);

  if (!question) return null;

  const ready = canSubmit(state, question);
  const early = canFinishEarly(state);

  return (
    <div className="quiz-screen fade-in">
      <div className="quiz-header">
        <button className="quiz-close" onClick={onExit} title="나가기" aria-label="퀴즈 나가기">
          <Icon name="x" size={18} />
        </button>
        <ProgressBar value={state.cursor + (state.answered ? 1 : 0)} max={state.queue.length} />
      </div>

      <div className="quiz-body">
        <div className="quiz-prompt">
          <div className="quiz-prompt-label">{subtitle ?? "한국어 문장"}</div>
          <div className="quiz-prompt-text">{question.ko}</div>
          {item.isRetry && <div className="quiz-hint" style={{ marginTop: 12 }}>↻ 다시 한 번 — 이번엔 맞춰보세요</div>}
        </div>

        <QuestionBody state={state} question={question} dispatch={dispatch} />

        {state.answered && <ResultPanel state={state} question={question} />}
      </div>

      <div className="quiz-footer">
        {!state.answered ? (
          <>
            {early && (
              <button className="btn btn-soft" onClick={() => dispatch({ type: "finishEarly" })}>
                <Icon name="sparkles" size={14} /> 미리 마치기 ({sessionScore(state).score}/{sessionScore(state).total})
              </button>
            )}
            <button className="btn btn-primary btn-block" onClick={submit} disabled={!ready}>확인</button>
          </>
        ) : (
          <button
            className={"btn btn-block " + (state.result.correct ? "btn-correct" : "btn-wrong")}
            onClick={next}
          >
            계속하기 →
          </button>
        )}
      </div>
    </div>
  );
}

// ── 유형별 본문 ────────────────────────────────────────────────
function QuestionBody({ state, question, dispatch }) {
  switch (question.type) {
    case "blank":
    case "arrange":
      return <CardQuestion state={state} question={question} dispatch={dispatch} />;
    case "typing":
      return <TypingQuestion state={state} question={question} dispatch={dispatch} />;
    case "choice":
      return <ChoiceQuestion state={state} question={question} dispatch={dispatch} />;
    case "error":
      return <ErrorQuestion state={state} question={question} dispatch={dispatch} />;
    default:
      return null;
  }
}

function CardQuestion({ state, question, dispatch }) {
  const { picked, bank, answered, result } = state;
  const slotClass =
    "sentence-blank" +
    (picked.length > 0 ? " has-tokens" : "") +
    (answered ? (result.correct ? " correct" : " wrong") : "");

  return (
    <>
      <div className="sentence-builder">
        {(question.prefix ?? []).map((w, i) => <span className="sentence-word" key={"p" + i}>{w}</span>)}
        <span className={slotClass}>
          {picked.length === 0 ? (
            <span className="blank-placeholder">?</span>
          ) : (
            picked.map((bankIdx, slot) => (
              <span
                key={slot}
                className="token-in-slot"
                onClick={() => dispatch({ type: "unpick", slot })}
                title={answered ? "" : "탭하여 취소"}
              >
                {bank[bankIdx]}
              </span>
            ))
          )}
        </span>
        {(question.suffix ?? []).map((w, i) => <span className="sentence-word" key={"s" + i}>{w}</span>)}
      </div>

      <div className="word-bank">
        {bank.map((w, i) => {
          const used = picked.includes(i);
          return (
            <button
              key={i}
              className={"word-card" + (used ? " used" : "")}
              onClick={() => dispatch({ type: "pick", index: i })}
              disabled={used || answered}
            >
              {i < 9 && <span className="word-card-key">{i + 1}</span>}
              <span className="word-card-inner">{w}</span>
            </button>
          );
        })}
      </div>

      <KeyHint keys={[["1", "9"], ["Backspace"], ["Enter"]]} labels={["카드 고르기", "되돌리기", "확인"]} />
    </>
  );
}

function TypingQuestion({ state, question, dispatch }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [question.id]);

  const cls = "typing-box" + (state.answered ? (state.result.correct ? " right" : " wrong") : "");
  const words = question.answer.filter((w) => /[a-zA-Z]/.test(w)).length;

  return (
    <>
      <div className={cls}>
        <input
          ref={ref}
          className="typing-input"
          value={state.typed}
          onChange={(e) => dispatch({ type: "type", value: e.target.value })}
          disabled={state.answered}
          placeholder="영어로 써 보세요"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          aria-label="영어 문장 입력"
        />
        <div className="typing-meta">
          <span>단어 {words}개 정도</span>
          <span>대소문자·축약형은 가리지 않아요</span>
        </div>
      </div>
      <KeyHint keys={[["Enter"]]} labels={["확인"]} />
    </>
  );
}

function ChoiceQuestion({ state, question, dispatch }) {
  const { choice, answered, result } = state;
  return (
    <>
      <div className="sentence-builder">
        {question.sentence.map((tok, i) =>
          tok === null ? (
            <span key={i} className={"sentence-blank" + (choice !== null ? " has-tokens" : "") + (answered ? (result.correct ? " correct" : " wrong") : "")}>
              {choice === null
                ? <span className="blank-placeholder">?</span>
                : <span className="token-in-slot">{question.choices[choice]}</span>}
            </span>
          ) : (
            <span className="sentence-word" key={i}>{tok}</span>
          )
        )}
      </div>

      <div className="choice-list">
        {question.choices.map((c, i) => {
          let cls = "choice-btn";
          if (answered) {
            if (i === question.correct) cls += " right";
            else if (i === choice) cls += " wrong";
          } else if (i === choice) cls += " on";
          return (
            <button key={i} className={cls} onClick={() => dispatch({ type: "choose", index: i })} disabled={answered}>
              {c}
            </button>
          );
        })}
      </div>
      <KeyHint keys={[["1", String(question.choices.length)], ["Enter"]]} labels={["고르기", "확인"]} />
    </>
  );
}

function ErrorQuestion({ state, question, dispatch }) {
  const { errIndex, errFix, answered, result } = state;
  return (
    <>
      <div className="quiz-hint" style={{ marginTop: 18 }}>
        어법에 맞지 않는 곳을 눌러 표시하고, 어떻게 고칠지 적어보세요.
      </div>
      <div className="error-tokens" style={{ marginTop: 10 }}>
        {question.tokens.map((tok, i) => {
          let cls = "error-token";
          if (answered) {
            if (i === question.wrongIndex) cls += result.pickedRight ? " right" : " reveal";
            else if (i === errIndex) cls += " wrong";
          } else if (i === errIndex) cls += " on";
          return (
            <button key={i} className={cls} onClick={() => dispatch({ type: "errPick", index: i })} disabled={answered}>
              {tok}
            </button>
          );
        })}
      </div>

      <div className="error-fix">
        <span className="error-fix-label">→ 이렇게 고쳐야 합니다</span>
        <input
          className="text-field"
          value={errFix}
          onChange={(e) => dispatch({ type: "errFix", value: e.target.value })}
          disabled={answered}
          placeholder="고친 형태"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          aria-label="고친 형태 입력"
        />
      </div>
      <KeyHint keys={[["1", "9"], ["Enter"]]} labels={["틀린 곳 짚기", "확인"]} />
    </>
  );
}

// ── 결과 ───────────────────────────────────────────────────────
function ResultPanel({ state, question }) {
  const { correct, expected } = state.result;
  return (
    <div className={"result-panel " + (correct ? "correct" : "wrong")}>
      <div className="result-headline">
        <span className="result-headline-icon"><Icon name={correct ? "check" : "x"} size={14} /></span>
        {correct ? "정답입니다!" : "다시 한 번 볼게요"}
      </div>
      {!correct && (
        <div className="result-correct-answer">
          <span className="result-correct-answer-label">정답</span>
          {question.type === "error" ? expected : joinTokens([expected])}
        </div>
      )}
      {question.explanation && (
        <div className="explanation">
          <div className="explanation-title">문법 설명</div>
          <div><Inline text={question.explanation} /></div>
        </div>
      )}
    </div>
  );
}

function KeyHint({ keys, labels }) {
  return (
    <div className="kbd-hint">
      {keys.map((k, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {i > 0 && <span style={{ opacity: 0.5, margin: "0 4px" }}>·</span>}
          {k.length === 2 ? (
            <><span className="kbd">{k[0]}</span>–<span className="kbd">{k[1]}</span></>
          ) : (
            <span className="kbd">{k[0]}</span>
          )}
          <span>{labels[i]}</span>
        </span>
      ))}
    </div>
  );
}

// ── 키보드 ─────────────────────────────────────────────────────
/** PC 로 풀 때 손이 마우스로 가지 않게. 입력란에 포커스가 있으면 숫자키는 넘긴다. */
function useKeyboard(state, question, dispatch, submit, next) {
  useEffect(() => {
    if (!question) return;

    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typingField = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName ?? "");

      if (e.key === "Enter") {
        e.preventDefault();
        if (state.answered) next();
        else if (canSubmit(state, question)) submit();
        return;
      }
      if (state.answered) return;

      if (e.key === "Backspace" && !typingField) {
        if (question.type === "blank" || question.type === "arrange") {
          if (state.picked.length) { e.preventDefault(); dispatch({ type: "unpick", slot: state.picked.length - 1 }); }
        }
        return;
      }

      if (typingField) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;

      const index = n - 1;
      if (question.type === "blank" || question.type === "arrange") {
        if (index < state.bank.length) { e.preventDefault(); dispatch({ type: "pick", index }); }
      } else if (question.type === "choice") {
        if (index < question.choices.length) { e.preventDefault(); dispatch({ type: "choose", index }); }
      } else if (question.type === "error") {
        if (index < question.tokens.length) { e.preventDefault(); dispatch({ type: "errPick", index }); }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, question, dispatch, submit, next]);
}
