// 퀴즈 완료 화면.
import { useEffect, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Confetti } from "../components/common.jsx";

export function CompletionScreen({ title, result, isReview, onBackHome, onRetry }) {
  const [confetti, setConfetti] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setConfetti(true), 250);
    return () => clearTimeout(t);
  }, []);

  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const praise =
    pct === 100 ? "완벽해요! 🎉" :
    pct >= 80 ? "정말 잘했어요!" :
    pct >= 60 ? "한 번 더 풀어볼까요?" :
    "괜찮아요, 차근차근!";

  return (
    <div className="completion-screen fade-in">
      <Confetti trigger={confetti} />
      <div className="completion-medal"><Icon name="trophy" size={40} /></div>
      <div>
        <div className="completion-title">{praise}</div>
        <div className="completion-subtitle" style={{ marginTop: 10 }}>
          {isReview ? "복습을 마쳤어요." : <>『{title}』{result.early ? " 챕터를 미리 마쳤어요." : " 챕터를 완료했어요."}</>}
        </div>
      </div>

      <div className="score-display">
        <div className="score-cell accent">
          <div className="score-cell-label">첫 시도 정답</div>
          <div className="score-cell-value">{result.score}/{result.total}</div>
        </div>
        <div className="score-cell">
          <div className="score-cell-label">최대 연속</div>
          <div className="score-cell-value">{result.maxStreak}</div>
        </div>
      </div>

      {result.score < result.total && (
        <p className="completion-note">틀린 문제는 오답노트에 담겼어요.</p>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16, width: "100%", maxWidth: 360 }}>
        <button className="btn btn-soft btn-block" onClick={onRetry}>다시 풀기</button>
        <button className="btn btn-primary btn-block" onClick={onBackHome}>홈으로</button>
      </div>
    </div>
  );
}
