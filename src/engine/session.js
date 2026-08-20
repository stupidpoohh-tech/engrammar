// 퀴즈 세션 — 순수 리듀서. 화면(useReducer)과 테스트가 같은 코드를 쓴다.
//
// 저장(오답노트 기록)은 화면 쪽에서 한다. 여기서는 부수효과를 두지 않는다.
import { grade } from "./grading.js";
import { shuffle, shuffleDistinct } from "./shuffle.js";

/** 카드형 문항의 카드 묶음을 새로 만든다. */
export function makeBank(question, rand = Math.random) {
  if (question.type === "arrange") return shuffleDistinct(question.answer, rand);
  if (question.type === "blank") return shuffle([...question.answer, ...question.distractors], rand);
  return [];
}

const freshInput = (item, rand) => ({
  bank: makeBank(item.question, rand),
  picked: [],
  typed: "",
  choice: null,
  errIndex: null,
  errFix: "",
  answered: false,
  result: null,
});

/**
 * items: [{ chapterId, question }]
 * opts.shuffleQuestions — 문항 순서도 섞을지
 */
export function createSession(items, opts = {}) {
  const rand = opts.rand ?? Math.random;
  const ordered = opts.shuffleQuestions ? shuffle(items, rand) : [...items];
  const queue = ordered.map((it, i) => ({ ...it, key: `${it.chapterId}/${it.question.id}#${i}`, isRetry: false }));
  return {
    queue,
    cursor: 0,
    originalCount: queue.length,
    firstTrySeen: [],
    firstTryCorrect: [],
    streak: 0,
    maxStreak: 0,
    finished: false,
    rand,
    ...freshInput(queue[0], rand),
  };
}

export const currentItem = (s) => s.queue[s.cursor] ?? null;

/** 지금까지 첫 시도로 푼 문항 기준 성적. */
export const sessionScore = (s) => ({
  score: s.firstTryCorrect.length,
  total: s.firstTrySeen.length,
});

/**
 * 미리 마치기 가능 여부.
 * 구버전은 여기서 total 을 5로 못 박아 7문제를 맞히면 7/5(140%)가 기록됐다.
 * 지금은 "첫 시도로 본 문항을 하나도 안 틀렸고, 최소 5문항을 봤고, 아직 남은 문항이 있을 때"
 * 로만 판단하고 성적은 실제로 푼 문항 수로 계산한다.
 */
export function canFinishEarly(s) {
  const { score, total } = sessionScore(s);
  return total >= EARLY_FINISH_MIN && score === total && total < s.originalCount;
}

export const EARLY_FINISH_MIN = 5;

export function reducer(state, action) {
  const item = currentItem(state);

  switch (action.type) {
    case "pick": {
      if (state.answered || state.picked.includes(action.index)) return state;
      return { ...state, picked: [...state.picked, action.index] };
    }
    case "unpick": {
      if (state.answered) return state;
      const picked = [...state.picked];
      picked.splice(action.slot, 1);
      return { ...state, picked };
    }
    case "type":
      return state.answered ? state : { ...state, typed: action.value };
    case "choose":
      return state.answered ? state : { ...state, choice: action.index };
    case "errPick":
      return state.answered ? state : { ...state, errIndex: action.index };
    case "errFix":
      return state.answered ? state : { ...state, errFix: action.value };

    case "reshuffle":
      // 같은 문항을 다시 풀 때 카드를 새로 섞는다 — 자리를 외워 넘기지 못하게
      return { ...state, ...freshInput(item, state.rand) };

    case "submit": {
      if (state.answered || !item) return state;
      const result = grade(item.question, responseOf(state, item.question));
      const next = { ...state, answered: true, result };

      if (!item.isRetry) {
        next.firstTrySeen = [...state.firstTrySeen, item.key];
        if (result.correct) {
          next.firstTryCorrect = [...state.firstTryCorrect, item.key];
          next.streak = state.streak + 1;
          next.maxStreak = Math.max(state.maxStreak, next.streak);
        } else {
          next.streak = 0;
        }
      }
      if (!result.correct) {
        // 틀린 문항은 큐 끝에 다시 넣는다 (세션 안에서만)
        next.queue = [...state.queue, { ...item, key: item.key + "r", isRetry: true }];
      }
      return next;
    }

    case "next": {
      if (!state.answered) return state;
      const cursor = state.cursor + 1;
      if (cursor >= state.queue.length) return { ...state, finished: true };
      return { ...state, cursor, ...freshInput(state.queue[cursor], state.rand) };
    }

    case "finishEarly":
      return canFinishEarly(state) ? { ...state, finished: true, early: true } : state;

    default:
      return state;
  }
}

/** 현재 입력을 채점기가 받는 형태로 바꾼다. */
export function responseOf(state, question) {
  switch (question.type) {
    case "blank":
    case "arrange":
      return state.picked.map((i) => state.bank[i]);
    case "typing":
      return state.typed;
    case "choice":
      return state.choice;
    case "error":
      return { index: state.errIndex, fix: state.errFix };
    default:
      return null;
  }
}

/** 확인 버튼을 누를 수 있는 상태인지. */
export function canSubmit(state, question) {
  if (state.answered) return false;
  switch (question.type) {
    case "blank":
    case "arrange":
      return state.picked.length > 0;
    case "typing":
      return state.typed.trim().length > 0;
    case "choice":
      return state.choice !== null;
    case "error":
      return state.errIndex !== null && state.errFix.trim().length > 0;
    default:
      return false;
  }
}
