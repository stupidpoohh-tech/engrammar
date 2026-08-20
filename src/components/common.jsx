// 여러 화면이 함께 쓰는 작은 부품들.
import { useEffect, useState } from "react";
import { Icon } from "./Icon.jsx";
import { MASTER_BOX } from "../engine/storage.js";

export function TopBar({ onHome, right }) {
  return (
    <div className="topbar">
      <button className="topbar-brand" onClick={onHome}>
        <span className="topbar-brand-mark">A</span>
        <span>고등영어문법</span>
      </button>
      <div className="topbar-stats">{right}</div>
    </div>
  );
}

/** 글자 없는 아이콘 버튼. 이름은 스크린리더와 툴팁으로만 전한다. */
export function IconButton({ name, label, onClick }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label={label} title={label}>
      <Icon name={name} size={17} />
    </button>
  );
}

/**
 * 화면 머리 — 제목은 왼쪽, 나가는 버튼은 같은 줄 오른쪽 끝.
 * 버튼이 한 줄을 통째로 차지하지 않게 모든 화면이 이 틀을 쓴다.
 */
export function ScreenHeader({ eyebrow, title, badge, action, children }) {
  return (
    <header className="screen-header">
      <div className="screen-header-row">
        <div className="screen-header-text">
          {eyebrow && <span className="chapter-eyebrow">{eyebrow}</span>}
          <h1 className="screen-title">
            {title}
            {badge}
          </h1>
        </div>
        {action}
      </div>
      {children}
    </header>
  );
}

const PORTFOLIO = "https://dada-portfolio.stupidpoohh.workers.dev/";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>만든사람 DADA</span>
      <a href={PORTFOLIO} target="_blank" rel="noopener noreferrer" aria-label="만든사람 포트폴리오 (새 창)" title="포트폴리오">
        <Icon name="home" size={16} />
      </a>
    </footer>
  );
}

export function ProgressBar({ value, max }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="progress-fill" style={{ width: pct + "%" }} />
    </div>
  );
}

/** 숙달도 — MASTER_BOX 만큼 연속으로 맞히면 오답노트에서 빠진다. */
export function BoxMeter({ box }) {
  return (
    <span className="box-meter" title={`숙달도 ${box}/${MASTER_BOX}`}>
      {Array.from({ length: MASTER_BOX }, (_, i) => (
        <span key={i} className={"box-dot" + (i < box ? " on" : "")} />
      ))}
    </span>
  );
}

/**
 * 정리(review) · 총정리(mega) 표시. 홈 목차와 같은 아이콘을 쓴다 —
 * 화면마다 글자 태그와 아이콘이 섞이지 않게.
 */
export function KindMark({ kind }) {
  if (kind !== "review" && kind !== "mega") return null;
  const mega = kind === "mega";
  const label = mega ? "총정리" : "정리";
  return (
    <span className={"kind-mark" + (mega ? " mega" : "")} title={label} aria-label={label}>
      <Icon name={mega ? "star" : "list"} size={13} />
    </span>
  );
}

export function EmptyNote({ children }) {
  return <div className="empty-note">{children}</div>;
}

export function Confetti({ trigger, duration = 2400 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ["#6B9D80", "#C9A26B", "#5C8478", "#C77A6C", "#7CAE93", "#E0C896"];
    setPieces(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        bg: colors[Math.floor(Math.random() * colors.length)],
        duration: 1.6 + Math.random() * 1.4,
        delay: Math.random() * 0.3,
        rotate: Math.random() * 360,
      }))
    );
    const t = setTimeout(() => setPieces([]), duration + 600);
    return () => clearTimeout(t);
  }, [trigger, duration]);

  if (!pieces.length) return null;
  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left + "%",
            background: p.bg,
            animationDuration: p.duration + "s",
            animationDelay: p.delay + "s",
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function Loading({ label = "불러오는 중..." }) {
  return <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>{label}</div>;
}
