/**
 * LearnPage — the Learn & Earn library.
 *
 * Combines two sections — Free Ebooks and Income Lessons — into a single
 * mobile-first vertical feed. Ebooks open an inline reader overlay showing
 * the full text with the `reader-prose` class and the `reader-fade` animation.
 * Lessons open a step-by-step viewer (one step at a time, Next/Previous,
 * "Step X of Y", Complete on the last step).
 *
 * Mirrors the FeedPage/FinancePage scroll-to-earn pattern: every 5 cards
 * scrolled in the combined library feed triggers a `recordScrollMilestone`
 * award and the `CoinAnimation` popup. The learn tint (warm violet) is used
 * for card accents, difficulty badges, and section headers.
 */
import CoinAnimation from "@/components/CoinAnimation";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useEbooks, useLessons, useRecordScrollMilestone } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Ebook, Lesson, LessonDifficulty } from "@/types/rewards";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogIn,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 5n;
const MILESTONE_EVERY = 5n;

/** A stable session id for grouping this scroll session's milestones. */
function useSessionId(): bigint {
  const ref = useRef<bigint>(0n);
  if (ref.current === 0n) {
    ref.current = BigInt(Date.now());
  }
  return ref.current;
}

/** A single card in the combined library feed (ebook or lesson). */
type LibraryCard =
  | { kind: "ebook"; index: number; ebook: Ebook }
  | { kind: "lesson"; index: number; lesson: Lesson };

/** Difficulty badge styling per level. */
const DIFFICULTY_STYLES: Record<
  LessonDifficulty,
  { label: string; className: string }
> = {
  beginner: {
    label: "Beginner",
    className:
      "border-success/40 bg-success/15 text-success-foreground bg-success text-success-foreground",
  },
  intermediate: {
    label: "Intermediate",
    className:
      "border-warning/40 bg-warning/15 text-warning-foreground bg-warning text-warning-foreground",
  },
  advanced: {
    label: "Advanced",
    className:
      "border-destructive/40 bg-destructive/15 text-destructive-foreground bg-destructive text-destructive-foreground",
  },
};

export function LearnPage() {
  const { isSignedIn, signIn, isLoggingIn } = useAuth();
  const { refresh: refreshCoins } = useCoins();
  const sessionId = useSessionId();

  // Ebooks pagination.
  const [ebookPages, setEbookPages] = useState<bigint[]>([0n]);
  const [ebookData, setEbookData] = useState<
    Record<string, { data?: Ebook[]; isLoading: boolean; isFetching: boolean }>
  >({});
  const [ebooksHasMore, setEbooksHasMore] = useState(true);

  // Lessons pagination.
  const [lessonPages, setLessonPages] = useState<bigint[]>([0n]);
  const [lessonData, setLessonData] = useState<
    Record<string, { data?: Lesson[]; isLoading: boolean; isFetching: boolean }>
  >({});
  const [lessonsHasMore, setLessonsHasMore] = useState(true);

  const recordMilestone = useRecordScrollMilestone();
  const reachedMilestoneRef = useRef<bigint>(0n);
  const viewedCountRef = useRef(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Reader / lesson viewer state.
  const [openEbook, setOpenEbook] = useState<Ebook | null>(null);
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const [lastAward, setLastAward] = useState<{
    amount: bigint;
    milestone: bigint;
  } | null>(null);

  // Reporters for per-page child components (Rules of Hooks).
  const reportEbookPage = useCallback(
    (
      offset: bigint,
      data: { data?: Ebook[]; isLoading: boolean; isFetching: boolean },
    ) => {
      setEbookData((prev) => {
        const key = offset.toString();
        const existing = prev[key];
        if (
          existing &&
          existing.isLoading === data.isLoading &&
          existing.isFetching === data.isFetching &&
          existing.data === data.data
        ) {
          return prev;
        }
        return { ...prev, [key]: data };
      });
    },
    [],
  );

  const reportLessonPage = useCallback(
    (
      offset: bigint,
      data: { data?: Lesson[]; isLoading: boolean; isFetching: boolean },
    ) => {
      setLessonData((prev) => {
        const key = offset.toString();
        const existing = prev[key];
        if (
          existing &&
          existing.isLoading === data.isLoading &&
          existing.isFetching === data.isFetching &&
          existing.data === data.data
        ) {
          return prev;
        }
        return { ...prev, [key]: data };
      });
    },
    [],
  );

  const ebooks = useMemo(() => {
    const all: Ebook[] = [];
    for (const offset of ebookPages) {
      const entry = ebookData[offset.toString()];
      if (entry?.data) all.push(...entry.data);
    }
    return all;
  }, [ebookPages, ebookData]);

  const lessons = useMemo(() => {
    const all: Lesson[] = [];
    for (const offset of lessonPages) {
      const entry = lessonData[offset.toString()];
      if (entry?.data) all.push(...entry.data);
    }
    return all;
  }, [lessonPages, lessonData]);

  const ebooksLoading = ebookPages.some(
    (offset) => ebookData[offset.toString()]?.isLoading,
  );
  const lessonsLoading = lessonPages.some(
    (offset) => lessonData[offset.toString()]?.isLoading,
  );
  const anyFetching =
    ebookPages.some((offset) => ebookData[offset.toString()]?.isFetching) ||
    lessonPages.some((offset) => lessonData[offset.toString()]?.isFetching);

  // Combined library feed: ebooks first, then lessons. Each card carries its
  // 0-based index in the combined feed for milestone tracking.
  const libraryCards = useMemo<LibraryCard[]>(() => {
    const cards: LibraryCard[] = [];
    ebooks.forEach((ebook, i) =>
      cards.push({ kind: "ebook", index: i, ebook }),
    );
    const ebookCount = ebooks.length;
    lessons.forEach((lesson, i) =>
      cards.push({ kind: "lesson", index: ebookCount + i, lesson }),
    );
    return cards;
  }, [ebooks, lessons]);

  // Infinite scroll: load more ebooks when the ebooks sentinel intersects.
  const ebookSentinelRef = useRef<HTMLDivElement | null>(null);
  const lessonSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingEbooksRef = useRef(false);
  const loadingLessonsRef = useRef(false);

  const loadMoreEbooks = useCallback(() => {
    if (loadingEbooksRef.current || !ebooksHasMore || anyFetching) return;
    loadingEbooksRef.current = true;
    setEbookPages((prev) => {
      const nextOffset = prev[prev.length - 1] + PAGE_SIZE;
      if (prev.includes(nextOffset)) return prev;
      return [...prev, nextOffset];
    });
  }, [ebooksHasMore, anyFetching]);

  const loadMoreLessons = useCallback(() => {
    if (loadingLessonsRef.current || !lessonsHasMore || anyFetching) return;
    loadingLessonsRef.current = true;
    setLessonPages((prev) => {
      const nextOffset = prev[prev.length - 1] + PAGE_SIZE;
      if (prev.includes(nextOffset)) return prev;
      return [...prev, nextOffset];
    });
  }, [lessonsHasMore, anyFetching]);

  useEffect(() => {
    const node = ebookSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) loadMoreEbooks();
        }
      },
      { rootMargin: "400px 0px 0px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMoreEbooks]);

  useEffect(() => {
    const node = lessonSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) loadMoreLessons();
        }
      },
      { rootMargin: "400px 0px 0px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMoreLessons]);

  // Decide whether there is more to load when a new page resolves.
  useEffect(() => {
    loadingEbooksRef.current = false;
    const lastOffset = ebookPages[ebookPages.length - 1];
    const lastEntry =
      lastOffset !== undefined ? ebookData[lastOffset.toString()] : undefined;
    if (lastEntry?.data) {
      setEbooksHasMore(lastEntry.data.length === Number(PAGE_SIZE));
    }
  }, [ebookPages, ebookData]);

  useEffect(() => {
    loadingLessonsRef.current = false;
    const lastOffset = lessonPages[lessonPages.length - 1];
    const lastEntry =
      lastOffset !== undefined ? lessonData[lastOffset.toString()] : undefined;
    if (lastEntry?.data) {
      setLessonsHasMore(lastEntry.data.length === Number(PAGE_SIZE));
    }
  }, [lessonPages, lessonData]);

  const checkMilestone = useCallback(
    (viewedIndex: number) => {
      const viewed = viewedIndex + 1;
      const milestone = BigInt(
        Math.floor(viewed / Number(MILESTONE_EVERY)) * Number(MILESTONE_EVERY),
      );
      if (milestone <= reachedMilestoneRef.current || milestone === 0n) return;
      if (!isSignedIn) return;

      reachedMilestoneRef.current = milestone;
      recordMilestone.mutate(
        { sessionId, milestone },
        {
          onSuccess: (result) => {
            if (result.__kind__ === "ok") {
              setLastAward({
                amount: result.ok.amount,
                milestone,
              });
              refreshCoins();
            }
          },
        },
      );
    },
    [isSignedIn, recordMilestone, sessionId, refreshCoins],
  );

  // Observe each card to count it as "viewed" when it scrolls into view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: libraryCards.length re-runs the observer setup when cards are added so new nodes get observed
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.idx ?? "-1");
          if (idx < 0) continue;
          if (idx + 1 > viewedCountRef.current) {
            viewedCountRef.current = idx + 1;
            checkMilestone(idx);
          }
        }
      },
      { threshold: 0.6 },
    );
    for (const node of cardRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [checkMilestone, libraryCards.length]);

  // Reader / lesson viewer take over the feed area when open.
  if (openEbook) {
    return (
      <div data-ocid="page.learn" className="pb-4">
        <EbookReader ebook={openEbook} onClose={() => setOpenEbook(null)} />
        <CoinAnimation
          amount={lastAward?.amount ?? null}
          milestone={lastAward?.milestone ?? null}
          onDismiss={() => setLastAward(null)}
        />
      </div>
    );
  }

  if (openLesson) {
    return (
      <div data-ocid="page.learn" className="pb-4">
        <LessonViewer lesson={openLesson} onClose={() => setOpenLesson(null)} />
        <CoinAnimation
          amount={lastAward?.amount ?? null}
          milestone={lastAward?.milestone ?? null}
          onDismiss={() => setLastAward(null)}
        />
      </div>
    );
  }

  return (
    <div data-ocid="page.learn" className="flex flex-col gap-4 pb-4">
      <LearnHeader />

      {!isSignedIn && (
        <GuestPreview isLoggingIn={isLoggingIn} onSignIn={signIn} />
      )}

      {/* Free Ebooks section. */}
      <section data-ocid="learn.section.ebooks" className="flex flex-col gap-3">
        <SectionHeader
          icon={BookOpen}
          title="Free Ebooks"
          subtitle="Read full books · earn coins as you scroll"
        />

        {/* Mount one EbookPageRow per requested page (Rules of Hooks). */}
        {ebookPages.map((offset) => (
          <EbookPageRow
            key={`ebook-${offset.toString()}`}
            offset={offset}
            pageSize={PAGE_SIZE}
            onReport={reportEbookPage}
          />
        ))}

        {ebooks.map((ebook, i) => (
          <div
            key={`ebook-card-${ebook.id.toString()}`}
            ref={(node) => {
              cardRefs.current[i] = node;
            }}
            data-idx={i}
          >
            <EbookCard ebook={ebook} onRead={() => setOpenEbook(ebook)} />
          </div>
        ))}

        {ebooksLoading && ebooks.length === 0 && <EbookSkeletons />}

        <div ref={ebookSentinelRef} className="h-1 w-full" aria-hidden="true" />
        {!ebooksHasMore && ebooks.length > 0 && (
          <EndOfSection label="That's all the ebooks" />
        )}
      </section>

      {/* Income Lessons section. */}
      <section
        data-ocid="learn.section.lessons"
        className="flex flex-col gap-3"
      >
        <SectionHeader
          icon={GraduationCap}
          title="Income Lessons"
          subtitle="Step-by-step skills · earn coins as you scroll"
        />

        {lessonPages.map((offset) => (
          <LessonPageRow
            key={`lesson-${offset.toString()}`}
            offset={offset}
            pageSize={PAGE_SIZE}
            onReport={reportLessonPage}
          />
        ))}

        {lessons.map((lesson, i) => {
          const cardIndex = ebooks.length + i;
          return (
            <div
              key={`lesson-card-${lesson.id.toString()}`}
              ref={(node) => {
                cardRefs.current[cardIndex] = node;
              }}
              data-idx={cardIndex}
            >
              <LessonCard
                lesson={lesson}
                onStart={() => setOpenLesson(lesson)}
              />
            </div>
          );
        })}

        {lessonsLoading && lessons.length === 0 && <LessonSkeletons />}

        <div
          ref={lessonSentinelRef}
          className="h-1 w-full"
          aria-hidden="true"
        />
        {!lessonsHasMore && lessons.length > 0 && (
          <EndOfSection label="That's all the lessons" />
        )}
      </section>

      <CoinAnimation
        amount={lastAward?.amount ?? null}
        milestone={lastAward?.milestone ?? null}
        onDismiss={() => setLastAward(null)}
      />
    </div>
  );
}

/**
 * EbookPageRow — mounts a single page's `useEbooks` query at the top level of
 * a child component (one per requested page offset) and reports the query
 * state up to the parent. Renders nothing visible.
 */
function EbookPageRow({
  offset,
  pageSize,
  onReport,
}: {
  offset: bigint;
  pageSize: bigint;
  onReport: (
    offset: bigint,
    data: { data?: Ebook[]; isLoading: boolean; isFetching: boolean },
  ) => void;
}) {
  const query = useEbooks(offset, pageSize);
  useEffect(() => {
    onReport(offset, {
      data: query.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
    });
  }, [offset, onReport, query.data, query.isLoading, query.isFetching]);
  return null;
}

/**
 * LessonPageRow — mounts a single page's `useLessons` query at the top level
 * of a child component (one per requested page offset) and reports the query
 * state up to the parent. Renders nothing visible.
 */
function LessonPageRow({
  offset,
  pageSize,
  onReport,
}: {
  offset: bigint;
  pageSize: bigint;
  onReport: (
    offset: bigint,
    data: { data?: Lesson[]; isLoading: boolean; isFetching: boolean },
  ) => void;
}) {
  const query = useLessons(offset, pageSize);
  useEffect(() => {
    onReport(offset, {
      data: query.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
    });
  }, [offset, onReport, query.data, query.isLoading, query.isFetching]);
  return null;
}

/**
 * LearnHeader — page header with the learn violet tint and a tagline about
 * free ebooks and income skills.
 */
function LearnHeader() {
  return (
    <header
      data-ocid="learn.header"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-learn/30",
        "bg-learn/10 px-4 py-3",
      )}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-learn/15 text-learn">
        <GraduationCap className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <h1 className="font-display text-lg font-bold leading-tight text-foreground">
          Learn &amp; Earn
        </h1>
        <p className="text-xs text-muted-foreground">
          Free ebooks &amp; income skills · earn coins as you scroll
        </p>
      </div>
    </header>
  );
}

/** Section header with the learn violet tint. */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof BookOpen;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-learn/15 text-learn">
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-base font-bold leading-tight text-foreground">
          {title}
        </h2>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/** Ebook card: cover image, title, author, and a Read button. */
function EbookCard({
  ebook,
  onRead,
}: {
  ebook: Ebook;
  onRead: () => void;
}) {
  return (
    <article
      data-ocid="learn.ebook.card"
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-subtle",
        "transition-smooth",
      )}
    >
      <div className="flex gap-3 p-3">
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {ebook.coverUrl ? (
            <img
              src={ebook.coverUrl}
              alt={`Cover of ${ebook.title}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-learn">
              <BookOpen className="h-6 w-6" strokeWidth={2} />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="font-display text-sm font-bold leading-tight text-foreground">
            {ebook.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            by {ebook.author}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {ebook.description}
          </p>
          <button
            type="button"
            data-ocid="learn.ebook.read_button"
            onClick={onRead}
            className={cn(
              "mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5",
              "text-xs font-semibold transition-smooth",
              "bg-learn text-learn-foreground",
              "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
            )}
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
            Read
          </button>
        </div>
      </div>
    </article>
  );
}

/** Lesson card: title, difficulty badge, description, and a Start button. */
function LessonCard({
  lesson,
  onStart,
}: {
  lesson: Lesson;
  onStart: () => void;
}) {
  const diff = DIFFICULTY_STYLES[lesson.difficulty];
  return (
    <article
      data-ocid="learn.lesson.card"
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-subtle",
        "transition-smooth",
      )}
    >
      <div className="flex flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-display text-sm font-bold leading-tight text-foreground">
            {lesson.title}
          </h3>
          <span
            data-ocid={`learn.lesson.badge.${lesson.difficulty}`}
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5",
              "text-[10px] font-semibold uppercase tracking-wide",
              diff.className,
            )}
          >
            {diff.label}
          </span>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {lesson.description}
        </p>
        <button
          type="button"
          data-ocid="learn.lesson.start_button"
          onClick={onStart}
          className={cn(
            "mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5",
            "text-xs font-semibold transition-smooth",
            "bg-learn text-learn-foreground",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
          )}
        >
          <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.5} />
          Start
        </button>
      </div>
    </article>
  );
}

/**
 * EbookReader — inline full-text reader overlay. Shows the book title and
 * author at the top, a back button, and the full text in the `reader-prose`
 * class for good line-height. Uses the `reader-fade` animation for the
 * transition in.
 */
function EbookReader({
  ebook,
  onClose,
}: { ebook: Ebook; onClose: () => void }) {
  return (
    <article
      data-ocid="learn.ebook.reader"
      className={cn(
        "overflow-hidden rounded-2xl border border-learn/30 bg-card shadow-elevated",
        "motion-safe:animate-reader-fade",
      )}
    >
      <header
        className={cn(
          "flex items-center gap-3 border-b border-border bg-learn/10 px-4 py-3",
        )}
      >
        <button
          type="button"
          data-ocid="learn.ebook.reader.back"
          aria-label="Back to library"
          onClick={onClose}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "border border-border bg-background text-foreground",
            "transition-smooth hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
          )}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold leading-tight text-foreground">
            {ebook.title}
          </h2>
          <p className="text-xs text-muted-foreground">by {ebook.author}</p>
        </div>
      </header>
      <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
        <div className="reader-prose whitespace-pre-line text-sm text-foreground">
          {ebook.fullText}
        </div>
      </div>
    </article>
  );
}

/**
 * LessonViewer — step-by-step lesson viewer. Shows one step at a time with
 * Next/Previous buttons, a "Step X of Y" progress indicator, and a Complete
 * button on the last step.
 */
function LessonViewer({
  lesson,
  onClose,
}: {
  lesson: Lesson;
  onClose: () => void;
}) {
  const steps = lesson.steps;
  const total = steps.length;
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const isLast = stepIndex === total - 1;

  // Reset step state if the lesson changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on lesson change; body does not read lesson
  useEffect(() => {
    setStepIndex(0);
    setCompleted(false);
  }, [lesson.id]);

  return (
    <article
      data-ocid="learn.lesson.viewer"
      className={cn(
        "overflow-hidden rounded-2xl border border-learn/30 bg-card shadow-elevated",
        "motion-safe:animate-reader-fade",
      )}
    >
      <header
        className={cn(
          "flex items-center gap-3 border-b border-border bg-learn/10 px-4 py-3",
        )}
      >
        <button
          type="button"
          data-ocid="learn.lesson.viewer.back"
          aria-label="Back to library"
          onClick={onClose}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "border border-border bg-background text-foreground",
            "transition-smooth hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
          )}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold leading-tight text-foreground">
            {lesson.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {total}
          </p>
        </div>
      </header>

      {/* Progress bar. */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-learn transition-smooth"
          style={{
            width: `${((stepIndex + 1) / total) * 100}%`,
          }}
        />
      </div>

      <div className="px-4 py-5">
        {completed ? (
          <div
            data-ocid="learn.lesson.viewer.complete"
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-learn/15 text-learn">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <h3 className="font-display text-lg font-bold text-foreground">
              Lesson complete!
            </h3>
            <p className="text-sm text-muted-foreground">
              You finished "{lesson.title}". Keep learning to earn more coins.
            </p>
            <button
              type="button"
              data-ocid="learn.lesson.viewer.done"
              onClick={onClose}
              className={cn(
                "mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2",
                "text-sm font-semibold transition-smooth",
                "bg-learn text-learn-foreground",
                "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
              )}
            >
              Back to library
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-learn">
              Step {stepIndex + 1}
            </div>
            <p className="reader-prose whitespace-pre-line text-sm text-foreground">
              {steps[stepIndex]}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                data-ocid="learn.lesson.viewer.prev"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                disabled={stepIndex === 0}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3.5 py-2",
                  "text-xs font-semibold transition-smooth",
                  "border border-border bg-background text-foreground",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
                  "disabled:opacity-40 disabled:pointer-events-none",
                )}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                Previous
              </button>

              {isLast ? (
                <button
                  type="button"
                  data-ocid="learn.lesson.viewer.complete_button"
                  onClick={() => setCompleted(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2",
                    "text-xs font-semibold transition-smooth",
                    "bg-learn text-learn-foreground",
                    "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
                  )}
                >
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  Complete
                </button>
              ) : (
                <button
                  type="button"
                  data-ocid="learn.lesson.viewer.next"
                  onClick={() =>
                    setStepIndex((i) => Math.min(total - 1, i + 1))
                  }
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3.5 py-2",
                    "text-xs font-semibold transition-smooth",
                    "bg-learn text-learn-foreground",
                    "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
                  )}
                >
                  Next
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

/** Guest-mode preview banner prompting sign-in to start earning. */
function GuestPreview({
  isLoggingIn,
  onSignIn,
}: {
  isLoggingIn: boolean;
  onSignIn: () => void;
}) {
  return (
    <output
      data-ocid="learn.guest_preview"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-learn/30",
        "bg-learn/10 px-3.5 py-3",
      )}
    >
      <LogIn className="h-5 w-5 shrink-0 text-learn" strokeWidth={2.5} />
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Preview mode.</span>{" "}
        Sign in to earn coins as you scroll.
      </p>
      <button
        type="button"
        data-ocid="learn.guest_preview.sign_in"
        onClick={onSignIn}
        disabled={isLoggingIn}
        className={cn(
          "shrink-0 rounded-full bg-learn px-3.5 py-1.5 text-xs font-semibold text-learn-foreground",
          "transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn",
          "disabled:opacity-50",
        )}
      >
        {isLoggingIn ? "Signing in…" : "Sign in"}
      </button>
    </output>
  );
}

/** End-of-section marker. */
function EndOfSection({ label }: { label: string }) {
  return (
    <div
      data-ocid="learn.section.end"
      className="py-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
    >
      {label}
    </div>
  );
}

/** Layout-matched loading skeletons for ebooks. */
function EbookSkeletons() {
  return (
    <div
      data-ocid="learn.ebook.loading_state"
      className="flex flex-col gap-3"
      aria-label="Loading ebooks"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="flex gap-3 p-3">
            <div className="h-24 w-16 shrink-0 animate-pulse rounded-md bg-muted" />
            <div className="flex-1 py-1">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Layout-matched loading skeletons for lessons. */
function LessonSkeletons() {
  return (
    <div
      data-ocid="learn.lesson.loading_state"
      className="flex flex-col gap-3"
      aria-label="Loading lessons"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card p-3.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
          <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default LearnPage;
