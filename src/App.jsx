import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MANIFEST, loadChapters, peekChapters, prefetchChapters } from "./content/index.js";
import { useRoute, paths } from "./lib/router.js";
import {
  subscribe, getProgress, getPrefs, setPref, recordChapterResult, migrateLegacy,
} from "./engine/storage.js";
import { buildReviewItems, weakCount } from "./engine/review.js";
import { HomeScreen } from "./screens/Home.jsx";
import { ChapterDetailScreen } from "./screens/ChapterDetail.jsx";
import { QuizScreen } from "./screens/Quiz.jsx";
import { CompletionScreen } from "./screens/Completion.jsx";
import { GrammarRefScreen } from "./screens/GrammarRef.jsx";
import { WrongNoteScreen } from "./screens/WrongNote.jsx";
import { StatsScreen } from "./screens/Stats.jsx";
import { SettingsScreen } from "./screens/Settings.jsx";
import { TopBar, Loading, EmptyNote } from "./components/common.jsx";
import { Icon } from "./components/Icon.jsx";

migrateLegacy();

/** 저장소가 바뀌면 화면을 다시 그린다. */
function useStore(read) {
  return useSyncExternalStore(subscribe, read, read);
}

export function App() {
  const [route, navigate] = useRoute();
  const progress = useStore(getProgress);
  const prefs = useStore(getPrefs);
  const weak = useStore(weakCount);

  const [chapters, setChapters] = useState(peekChapters);
  const [completion, setCompletion] = useState(null);

  const mode = prefs.mode === "typing" ? "typing" : "card";

  // 홈은 manifest 만으로 그린다. 본문이 필요한 화면에 들어갈 때 큰 청크를 받는다.
  const needsContent = route.head !== "home";
  useEffect(() => {
    if (!needsContent || chapters) return;
    let alive = true;
    loadChapters().then((all) => { if (alive) setChapters(all); });
    return () => { alive = false; };
  }, [needsContent, chapters]);

  // 홈에 머무는 동안 미리 받아 두면 챕터를 눌렀을 때 기다리지 않는다
  useEffect(() => { if (!chapters) prefetchChapters(); }, [chapters]);

  const chapterById = useCallback((id) => chapters?.find((c) => c.id === id) ?? null, [chapters]);

  const go = useMemo(
    () => ({
      home: () => { setCompletion(null); navigate(paths.home()); },
      chapter: (id) => { setCompletion(null); navigate(paths.chapter(id)); },
      quiz: (id) => { setCompletion(null); navigate(paths.quiz(id)); },
      review: () => { setCompletion(null); navigate(paths.review()); },
      wrong: () => { setCompletion(null); navigate(paths.wrong()); },
      grammar: (id) => { setCompletion(null); navigate(paths.grammar(id)); },
      stats: () => navigate(paths.stats()),
      settings: () => navigate(paths.settings()),
    }),
    [navigate]
  );

  // ── 퀴즈 종료 ────────────────────────────────────────────────
  function finishChapterQuiz(chapter, result) {
    recordChapterResult(chapter.id, result.score, result.total);
    setCompletion({ title: chapter.title, result, retry: () => go.quiz(chapter.id) });
  }

  function finishReview(result) {
    setCompletion({ title: "복습", result, isReview: true, retry: () => go.review() });
  }

  // ── 화면 고르기 ──────────────────────────────────────────────
  let screen;
  let bare = false; // 퀴즈는 자체 상단바를 쓴다

  if (completion) {
    screen = (
      <CompletionScreen
        title={completion.title}
        result={completion.result}
        isReview={completion.isReview}
        onBackHome={go.home}
        onRetry={() => { const r = completion.retry; setCompletion(null); r(); }}
      />
    );
  } else if (route.head === "home") {
    screen = (
      <HomeScreen
        progress={progress}
        weak={weak}
        onOpenChapter={go.chapter}
        onOpenGrammar={() => go.grammar()}
        onReview={go.review}
        onWrongNote={go.wrong}
        onStats={go.stats}
      />
    );
  } else if (!chapters) {
    screen = <Loading />;
  } else if (route.head === "chapter") {
    const chapter = chapterById(route.id);
    screen = chapter ? (
      <ChapterDetailScreen
        chapter={chapter}
        progress={progress[chapter.id]}
        mode={mode}
        onSetMode={(m) => setPref("mode", m)}
        onBack={go.home}
        onStart={() => go.quiz(chapter.id)}
        onOpenGrammar={go.grammar}
      />
    ) : (
      <NotFound what="챕터" onHome={go.home} />
    );
  } else if (route.head === "quiz") {
    const chapter = chapterById(route.id);
    if (!chapter) {
      screen = <NotFound what="챕터" onHome={go.home} />;
    } else {
      bare = true;
      screen = (
        <QuizScreen
          key={`${chapter.id}:${mode}`}
          items={chapter.questions.map((q) => ({ chapterId: chapter.id, question: q }))}
          mode={mode}
          onExit={() => go.chapter(chapter.id)}
          onComplete={(result) => finishChapterQuiz(chapter, result)}
        />
      );
    }
  } else if (route.head === "review") {
    const items = buildReviewItems(chapters);
    if (!items.length) {
      screen = (
        <EmptyNote>
          복습할 문제가 없어요.<br />
          <button className="btn btn-soft btn-sm" style={{ marginTop: 16 }} onClick={go.home}>홈으로</button>
        </EmptyNote>
      );
    } else {
      bare = true;
      screen = (
        <QuizScreen
          key={`review:${mode}:${items.length}`}
          items={items}
          mode={mode}
          subtitle="복습 · 한국어 문장"
          onExit={go.home}
          onComplete={finishReview}
        />
      );
    }
  } else if (route.head === "wrong") {
    screen = (
      <WrongNoteScreen
        chapters={chapters}
        onBack={go.home}
        onReview={go.review}
        onOpenChapter={go.chapter}
      />
    );
  } else if (route.head === "grammar") {
    screen = (
      <GrammarRefScreen
        chapters={chapters}
        activeId={route.id ?? chapters[0]?.id}
        onSelect={(id) => navigate(paths.grammar(id))}
        onBack={go.home}
        onQuiz={go.quiz}
      />
    );
  } else if (route.head === "stats") {
    screen = <StatsScreen chapters={chapters} progress={progress} onBack={go.home} onOpenChapter={go.chapter} />;
  } else if (route.head === "settings") {
    screen = <SettingsScreen onBack={go.home} />;
  } else {
    screen = <NotFound what="페이지" onHome={go.home} />;
  }

  useDocumentTitle(route, chapterById);

  return (
    <div className="app-shell">
      {!bare && (
        <TopBar
          onHome={go.home}
          right={
            <button className="stat-chip" onClick={go.settings} title="기록 관리">
              <Icon name="settings" size={14} />
            </button>
          }
        />
      )}
      <div className="app-container">{screen}</div>
    </div>
  );
}

function NotFound({ what, onHome }) {
  return (
    <EmptyNote>
      {what}를 찾을 수 없어요.<br />
      <button className="btn btn-soft btn-sm" style={{ marginTop: 16 }} onClick={onHome}>홈으로</button>
    </EmptyNote>
  );
}

/** 브라우저 탭·방문기록에 지금 보는 문법이 남도록. */
function useDocumentTitle(route, chapterById) {
  useEffect(() => {
    const base = "영어문법 학습";
    const named = {
      review: "복습", wrong: "오답노트", stats: "학습 통계", settings: "기록 관리",
    }[route.head];
    let title = base;
    if (named) title = `${named} · ${base}`;
    else if (route.id) {
      const c = chapterById(route.id) ?? MANIFEST.find((m) => m.id === route.id);
      if (c) title = `${c.title} · ${base}`;
    }
    document.title = title;
  }, [route, chapterById]);
}
