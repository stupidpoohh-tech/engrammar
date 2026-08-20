// 기록 관리.
//
// 진도를 서버에 두지 않기로 했으므로, 기기를 바꾸거나 브라우저 데이터를 지우면
// 기록이 사라진다. 그 한 가지 약점을 파일 내보내기/불러오기로 메운다.
import { useRef, useState } from "react";
import { exportAll, importAll, resetAll } from "../engine/storage.js";
import { Icon } from "../components/Icon.jsx";
import { BackButton } from "../components/common.jsx";

export function SettingsScreen({ onBack, refresh }) {
  const fileRef = useRef(null);
  const [notice, setNotice] = useState(null);

  function download() {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `영어문법-학습기록-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice({ ok: true, text: "학습 기록을 내려받았어요." });
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      importAll(JSON.parse(await file.text()));
      refresh?.();
      setNotice({ ok: true, text: "학습 기록을 불러왔어요." });
    } catch (err) {
      setNotice({ ok: false, text: "불러오지 못했습니다 — " + err.message });
    }
  }

  function reset() {
    if (!window.confirm("진도와 오답노트가 모두 지워집니다. 계속할까요?")) return;
    resetAll();
    refresh?.();
    setNotice({ ok: true, text: "기록을 모두 지웠어요." });
  }

  return (
    <div className="fade-in">
      <div className="screen-head">
        <BackButton onClick={onBack} />
      </div>
      <h1 className="screen-title">기록 관리</h1>
      <p className="screen-sub">
        진도와 오답노트는 이 브라우저에만 저장됩니다. 기기를 옮기거나 브라우저 데이터를
        지우기 전에 파일로 내보내 두세요.
      </p>

      {notice && (
        <div
          className="result-panel"
          style={{
            background: notice.ok ? "var(--correct-faint)" : "var(--wrong-faint)",
            border: `1px solid ${notice.ok ? "var(--correct-soft)" : "var(--wrong-soft)"}`,
            marginBottom: 8,
          }}
        >
          <div className="result-headline" style={{ color: notice.ok ? "var(--correct-deep)" : "var(--wrong-deep)" }}>
            <span className="result-headline-icon" style={{ background: notice.ok ? "var(--correct)" : "var(--wrong)" }}>
              <Icon name={notice.ok ? "check" : "alert"} size={13} />
            </span>
            {notice.text}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: "4px 18px", marginTop: 16 }}>
        <div className="setting-row">
          <div className="setting-row-body">
            <div className="setting-row-title">기록 내보내기</div>
            <div className="setting-row-desc">진도·오답노트를 JSON 파일 하나로 저장합니다.</div>
          </div>
          <button className="btn btn-soft btn-sm" onClick={download}>
            <Icon name="download" size={14} /> 내보내기
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-row-body">
            <div className="setting-row-title">기록 불러오기</div>
            <div className="setting-row-desc">내보낸 파일을 읽어 이 브라우저의 기록을 덮어씁니다.</div>
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={14} /> 불러오기
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={upload} hidden />
        </div>

        <div className="setting-row">
          <div className="setting-row-body">
            <div className="setting-row-title danger">모두 지우기</div>
            <div className="setting-row-desc">진도와 오답노트를 되돌릴 수 없게 지웁니다.</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={reset}>
            <Icon name="trash" size={14} /> 지우기
          </button>
        </div>
      </div>
    </div>
  );
}
