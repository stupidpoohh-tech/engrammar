// 채점.
//
// 구버전은 정답 문자열 하나와 위치까지 똑같이 맞아야 했다. 그래서 "do not" 을 가르치는
// 문항에서 "don't" 를 쓰면 틀린 것이 됐다. 여기서는 두 가지로 푼다:
//   1. 문항이 직접 대안을 적을 수 있다 (accept)
//   2. 축약형처럼 어느 쪽을 써도 같은 문장은 정규화 단계에서 흡수한다

/** 어느 쪽으로 써도 같은 문장이 되는 짝. 왼쪽(축약형)을 오른쪽으로 편다. */
const CONTRACTIONS = [
  ["don't", "do not"], ["doesn't", "does not"], ["didn't", "did not"],
  ["isn't", "is not"], ["aren't", "are not"], ["wasn't", "was not"], ["weren't", "were not"],
  ["haven't", "have not"], ["hasn't", "has not"], ["hadn't", "had not"],
  ["won't", "will not"], ["wouldn't", "would not"], ["can't", "cannot"], ["cannot", "can not"],
  ["couldn't", "could not"], ["shouldn't", "should not"], ["mustn't", "must not"],
  ["i'm", "i am"], ["you're", "you are"], ["we're", "we are"], ["they're", "they are"],
  ["he's", "he is"], ["she's", "she is"], ["it's", "it is"], ["that's", "that is"],
  ["i've", "i have"], ["you've", "you have"], ["we've", "we have"], ["they've", "they have"],
  ["i'll", "i will"], ["you'll", "you will"], ["he'll", "he will"], ["she'll", "she will"],
  ["we'll", "we will"], ["they'll", "they will"], ["i'd", "i would"],
];

/** 토큰 하나를 비교용으로 다듬는다 — 대소문자·따옴표 모양·앞뒤 공백. */
export function normToken(token) {
  return String(token ?? "")
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")   // ’ → '
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** 토큰 배열을 비교용 한 줄로 만든다. 축약형은 편 형태로 통일한다. */
export function normSentence(tokens) {
  let s = tokens.map(normToken).filter(Boolean).join(" ");
  for (const [short, long] of CONTRACTIONS) {
    s = s.replace(new RegExp(`(^|[^a-z'])${short.replace(/'/g, "'")}(?![a-z'])`, "g"), `$1${long}`);
  }
  return s.replace(/\s+([,.!?;:])/g, "$1").replace(/\s+/g, " ").trim();
}

/** 문항이 정답으로 인정하는 모든 형태. */
export function acceptedForms(question) {
  return [question.answer ?? [], ...(question.accept ?? [])];
}

/**
 * 채점. 어떤 유형이든 { correct, expected } 를 돌려준다.
 * expected 는 오답일 때 보여줄 모범답안(문자열).
 */
export function grade(question, response) {
  switch (question.type) {
    case "blank":
    case "arrange":
    case "typing": {
      const forms = acceptedForms(question);
      const got = normSentence(Array.isArray(response) ? response : tokenize(response));
      const correct = forms.some((f) => normSentence(f) === got);
      return { correct, expected: (question.answer ?? []).join(" ") };
    }
    case "choice": {
      const correct = response === question.correct;
      return { correct, expected: question.choices[question.correct] };
    }
    case "error": {
      // 틀린 자리를 짚고, 무엇으로 고칠지까지 맞아야 정답
      const picked = response?.index === question.wrongIndex;
      const fixed = normToken(response?.fix) === normToken(question.fix);
      return {
        correct: picked && fixed,
        expected: `${question.tokens[question.wrongIndex]} → ${question.fix}`,
        pickedRight: picked,
      };
    }
    default:
      return { correct: false, expected: "" };
  }
}

/** 타이핑 입력을 토큰으로 쪼갠다. 문장부호는 따로 떼어 낸다. */
export function tokenize(text) {
  return String(text ?? "")
    .replace(/([,.!?;:])/g, " $1 ")
    .split(/\s+/)
    .filter(Boolean);
}

/** 문항의 완성된 영어 문장 — 영작 모드와 읽어주기가 쓴다. */
export function fullSentence(question) {
  if (question.type === "choice") {
    return question.sentence.map((t) => (t === null ? question.choices[question.correct] : t)).join(" ");
  }
  if (question.type === "error") {
    return question.tokens.map((t, i) => (i === question.wrongIndex ? question.fix : t)).join(" ");
  }
  return [...(question.prefix ?? []), ...(question.answer ?? []), ...(question.suffix ?? [])].join(" ");
}

/** 화면에 보여줄 문장 — 토큰 사이 공백을 자연스럽게 다듬는다. */
export function joinTokens(tokens) {
  return tokens
    .join(" ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+'/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
