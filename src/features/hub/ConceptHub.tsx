import type { ConceptArea } from '../../types/concept';

type ConceptHubProps = {
  concepts: ConceptArea[];
  completedConceptIds: Set<string>;
  isCelebrationOpen: boolean;
  onCloseCelebration: () => void;
  onRestartExploration: () => void;
  onSelectConcept: (conceptId: string) => void;
};

const cardTone = {
  blue: {
    badge: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200',
    card: 'border-cyan-300/25 shadow-cyan-950/40 hover:border-cyan-300/70 hover:shadow-cyan-500/20',
    glow: 'from-cyan-400/18',
    ring: 'focus:ring-cyan-300',
    action: 'text-cyan-200 group-hover:text-cyan-100',
  },
  violet: {
    badge: 'border-violet-300/30 bg-violet-300/10 text-violet-200',
    card: 'border-violet-300/25 shadow-violet-950/40 hover:border-violet-300/70 hover:shadow-violet-500/20',
    glow: 'from-violet-400/18',
    ring: 'focus:ring-violet-300',
    action: 'text-violet-200 group-hover:text-violet-100',
  },
  green: {
    badge: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
    card: 'border-emerald-300/25 shadow-emerald-950/40 hover:border-emerald-300/70 hover:shadow-emerald-500/20',
    glow: 'from-emerald-400/18',
    ring: 'focus:ring-emerald-300',
    action: 'text-emerald-200 group-hover:text-emerald-100',
  },
  orange: {
    badge: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
    card: 'border-amber-300/25 shadow-amber-950/40 hover:border-amber-300/70 hover:shadow-amber-500/20',
    glow: 'from-amber-400/18',
    ring: 'focus:ring-amber-300',
    action: 'text-amber-200 group-hover:text-amber-100',
  },
};

export function ConceptHub({
  concepts,
  completedConceptIds,
  isCelebrationOpen,
  onCloseCelebration,
  onRestartExploration,
  onSelectConcept,
}: ConceptHubProps) {
  const completedCount = completedConceptIds.size;
  const progress = Math.round((completedCount / concepts.length) * 100);
  const completedConcepts = concepts.filter((concept) =>
    completedConceptIds.has(concept.id),
  );

  return (
    <section className="space-y-6" id="concept-hub">
      <div className="rounded-lg border border-white/10 bg-slate-950/60 p-5 shadow-[0_0_70px_rgba(59,130,246,0.18)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Quantum Probability Lab
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-4xl">
              양자역학 속 확률 탐험실
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300 sm:text-base">
              {`양자역학에서 ‘확률’은 어떻게 작동할까요?

이중슬릿, 중첩, 터널 효과, 전자구름을 통해
양자역학 속 ‘확률’의 의미를 탐험해봅시다.`}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 lg:w-72">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-100">
              <span>전체 진행률</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-900/80">
              <div
                className="h-full rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.72)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-300">
              {completedCount}/{concepts.length} 탐험 완료
            </p>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-sm font-bold text-slate-100">완료한 탐험</p>
              {completedConcepts.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {completedConcepts.map((concept) => (
                    <li
                      className="text-sm font-semibold leading-6 text-emerald-200"
                      key={concept.id}
                    >
                      ✓ {concept.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  - 아직 완료한 탐험이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {concepts.map((concept) => {
          const isCompleted = completedConceptIds.has(concept.id);
          const questionCount = concept.questions.length;
          const tone = cardTone[concept.color];

          return (
            <button
              className={`group relative flex min-h-[34rem] flex-col overflow-hidden rounded-lg border bg-slate-950/72 p-5 text-left shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${tone.card} ${tone.ring}`}
              key={concept.id}
              onClick={() => onSelectConcept(concept.id)}
              type="button"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${tone.glow} to-transparent opacity-90 transition group-hover:opacity-100`}
              />
              <div className="relative flex h-10 items-start justify-between gap-3">
                <span
                  className={`inline-flex min-h-8 items-center rounded-md border px-2.5 py-1 text-xs font-bold ${tone.badge}`}
                >
                  {concept.activityLabel}
                </span>
                <span
                  aria-label={isCompleted ? '완료됨' : '미완료'}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    isCompleted
                      ? 'border-emerald-300/60 bg-emerald-300/15 text-emerald-200 shadow-[0_0_18px_rgba(110,231,183,0.35)]'
                      : 'border-white/15 bg-white/5 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : '0'}
                </span>
              </div>

              <div className="relative mt-5">
                <h3 className="min-h-16 text-xl font-bold leading-8 text-white">
                  {concept.title}
                </h3>
                <p className="mt-1 min-h-14 text-lg font-semibold leading-7 text-slate-200">
                  {concept.subtitle}
                </p>
              </div>

              <p className="relative mt-4 min-h-32 text-sm leading-6 text-slate-300">
                {concept.summary}
              </p>

              <div className="relative mt-5 min-h-36 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  학습 목표
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {concept.classroomGoal}
                </p>
              </div>

              <div className="relative mt-auto flex items-center justify-between gap-3 pt-5">
                <p className={`text-sm font-bold ${tone.action}`}>
                  탐험 시작하기 →
                </p>
                {isCompleted ? (
                  <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-200">
                    탐험 완료
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    {questionCount}문항
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {isCelebrationOpen ? (
        <CompletionCelebration
          onClose={onCloseCelebration}
          onRestart={onRestartExploration}
        />
      ) : null}
    </section>
  );
}

const celebrationStars = [
  { left: '8%', top: '17%', delay: '0s', duration: '2.8s' },
  { left: '18%', top: '71%', delay: '0.7s', duration: '3.4s' },
  { left: '29%', top: '11%', delay: '1.2s', duration: '2.6s' },
  { left: '41%', top: '82%', delay: '0.35s', duration: '3.1s' },
  { left: '56%', top: '16%', delay: '1.6s', duration: '3.6s' },
  { left: '68%', top: '76%', delay: '0.9s', duration: '2.9s' },
  { left: '79%', top: '9%', delay: '0.2s', duration: '3.3s' },
  { left: '91%', top: '62%', delay: '1.35s', duration: '2.7s' },
];

function CompletionCelebration({
  onClose,
  onRestart,
}: {
  onClose: () => void;
  onRestart: () => void;
}) {
  return (
    <div
      aria-labelledby="completion-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/88 px-4 py-8 backdrop-blur-md"
      role="dialog"
    >
      <div className="celebration-aurora pointer-events-none absolute inset-0" />
      <div className="celebration-orbit pointer-events-none absolute h-[min(82vw,46rem)] w-[min(82vw,46rem)] rounded-full border border-cyan-200/15" />
      <div className="celebration-orbit celebration-orbit-reverse pointer-events-none absolute h-[min(62vw,34rem)] w-[min(62vw,34rem)] rounded-full border border-violet-200/20" />
      {celebrationStars.map((star, index) => (
        <span
          className="celebration-star pointer-events-none absolute"
          key={`${star.left}-${star.top}`}
          style={{
            animationDelay: star.delay,
            animationDuration: star.duration,
            left: star.left,
            top: star.top,
          }}
        >
          {index % 3 === 0 ? '✦' : '✧'}
        </span>
      ))}

      <div className="celebration-panel relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-200/30 bg-slate-950/90 p-6 text-center shadow-[0_0_45px_rgba(34,211,238,0.28),0_0_120px_rgba(139,92,246,0.25)] sm:p-10">
        <div className="celebration-scan pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-300/10 shadow-[0_0_38px_rgba(103,232,249,0.45)]">
            <span
              aria-hidden="true"
              className="text-4xl text-cyan-100 drop-shadow-[0_0_12px_rgba(165,243,252,0.95)]"
            >
              ✦
            </span>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.35em] text-cyan-300 sm:text-sm">
            Mission Complete
          </p>
          <h2
            className="mt-3 text-3xl font-black leading-tight text-white drop-shadow-[0_0_18px_rgba(103,232,249,0.45)] sm:text-5xl"
            id="completion-title"
          >
            양자 확률 탐험 완료!
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
            이중슬릿, 중첩, 터널 효과, 전자구름을 통해 양자역학 속 ‘확률’의
            의미를 모두 탐험했어요.
          </p>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              className="rounded-md border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-cyan-200/60 hover:bg-cyan-200/10 hover:text-white"
              onClick={onClose}
              type="button"
            >
              허브로 돌아가기
            </button>
            <button
              className="rounded-md bg-gradient-to-r from-cyan-300 to-violet-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.35)] transition hover:brightness-110"
              onClick={onRestart}
              type="button"
            >
              다시 탐험하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
