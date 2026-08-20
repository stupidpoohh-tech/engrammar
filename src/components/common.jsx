// 여러 화면이 함께 쓰는 작은 부품들.
import { useEffect, useState } from "react";
import { Icon } from "./Icon.jsx";
import { MASTER_BOX } from "../engine/storage.js";

export function TopBar({ onHome, right }) {
  return (
    <div className="topbar">
      <button className="topbar-brand" onClick={onHome}>
        <span className="topbar-brand-mark">A</span>
        <span>영어문법 학습</span>
      </button>
      <div className="topbar-stats">{right}</div>
    </div>
  );
}

export function BackButton({ onClick, label = "홈으로" }) {
  return (
    <button className="btn btn-soft btn-sm" onClick={onClick}>
      <Icon name="arrow-left" size={14} /> {label}
    </button>
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

export function KindTag({ kind }) {
  if (kind === "review") return <span className="tag tag-review">정리</span>;
  if (kind === "mega") return <span className="tag tag-mega">마스터</span>;
  return null;
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
