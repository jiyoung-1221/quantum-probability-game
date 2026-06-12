import { useState } from 'react';
import type {
  BranchingAnswer,
  BranchingConceptQuestion,
  ChoiceConceptQuestion,
  ConceptArea,
  ConceptQuestion,
  OrderingConceptQuestion,
} from '../../types/concept';
import type { StudentAnswerRecord } from '../../types/result';

type AssessmentGameProps = {
  concept: ConceptArea;
  onBackToHub: () => void;
  onComplete: () => void;
  onRecordAnswer: (record: StudentAnswerRecord) => void;
};

type QuestionResult = {
  questionId: string;
  isCorrect: boolean;
};

const arraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

type BranchingSlotKey = 'start' | 'middle' | 'leftResult' | 'rightResult';

type BranchingSlots = Record<BranchingSlotKey, string | null>;

const branchingSlotKeys: BranchingSlotKey[] = [
  'start',
  'middle',
  'leftResult',
  'rightResult',
];

const createEmptyBranchingSlots = (): BranchingSlots => ({
  start: null,
  middle: null,
  leftResult: null,
  rightResult: null,
});

const branchingResultMatches = (
  leftResult: string | null,
  rightResult: string | null,
  answer: BranchingAnswer,
) =>
  (leftResult === answer.leftResult && rightResult === answer.rightResult) ||
  (leftResult === answer.rightResult && rightResult === answer.leftResult);

const branchingAnswerMatches = (
  slots: BranchingSlots,
  answer: BranchingAnswer,
) =>
  slots.start === answer.start &&
  slots.middle === answer.middle &&
  branchingResultMatches(slots.leftResult, slots.rightResult, answer);

const isBranchingComplete = (slots: BranchingSlots) =>
  branchingSlotKeys.every((key) => slots[key] !== null);

const friendlyFlowLabels = [
  '먼저 생각해보기',
  '순서 맞추기',
  '핵심 개념 도전',
  '결과 예상하기',
  '⚠️ 이런 생각, 맞을까?',
];

export function AssessmentGame({
  concept,
  onBackToHub,
  onComplete,
  onRecordAnswer,
}: AssessmentGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [orderedChoiceIds, setOrderedChoiceIds] = useState<string[]>([]);
  const [branchingSlots, setBranchingSlots] = useState<BranchingSlots>(
    createEmptyBranchingSlots,
  );
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [retriedQuestionIds, setRetriedQuestionIds] = useState<Set<string>>(
    () => new Set(),
  );

  const question = concept.questions[currentIndex] ?? null;

  if (!question) {
    return (
      <section className="rounded-lg border border-white/10 bg-slate-950/70 p-5 shadow-panel backdrop-blur-xl sm:p-6">
        <button
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/70 hover:bg-cyan-300/10 hover:text-cyan-100"
          onClick={onBackToHub}
          type="button"
        >
          허브로 돌아가기
        </button>
        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Formative Assessment
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{concept.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            이 영역의 문항 데이터는 아직 준비 중입니다.
          </p>
        </div>
      </section>
    );
  }

  const isCorrect =
    question.type === 'ordering'
      ? arraysEqual(orderedChoiceIds, question.correctAnswer)
      : question.type === 'branching'
        ? branchingAnswerMatches(branchingSlots, question.correctAnswer)
        : selectedChoiceId === question.correctAnswer;
  const canSubmit =
    question.type === 'ordering'
      ? orderedChoiceIds.length === question.choices.length
      : question.type === 'branching'
        ? isBranchingComplete(branchingSlots)
        : selectedChoiceId !== null;
  const score = results.filter((result) => result.isCorrect).length;
  const isLastQuestion = currentIndex === concept.questions.length - 1;
  const feedbackItems = getFeedbackItems(
    question,
    selectedChoiceId,
    orderedChoiceIds,
    isCorrect,
  );

  const submitAnswer = () => {
    if (!canSubmit) return;

    onRecordAnswer({
      areaId: concept.id,
      areaTitle: concept.title,
      questionId: question.id,
      prompt: question.prompt,
      selectedAnswer: getSelectedAnswerText(
        question,
        selectedChoiceId,
        orderedChoiceIds,
        branchingSlots,
      ),
      isCorrect,
      retried: retriedQuestionIds.has(question.id),
      answeredAt: new Date().toISOString(),
    });
    setResults((current) => [
      ...current.filter((result) => result.questionId !== question.id),
      { questionId: question.id, isCorrect },
    ]);
    setSubmitted(true);
  };

  const goNext = () => {
    if (isLastQuestion) {
      onComplete();
      return;
    }

    setCurrentIndex((current) => current + 1);
    setSelectedChoiceId(null);
    setOrderedChoiceIds([]);
    setBranchingSlots(createEmptyBranchingSlots());
    setSubmitted(false);
  };

  const retryQuestion = () => {
    setSelectedChoiceId(null);
    setOrderedChoiceIds([]);
    setBranchingSlots(createEmptyBranchingSlots());
    setSubmitted(false);
    setRetriedQuestionIds((current) => new Set(current).add(question.id));
    setResults((current) =>
      current.filter((result) => result.questionId !== question.id),
    );
  };

  const moveChoice = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedChoiceIds.length || submitted) return;

    setOrderedChoiceIds((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-slate-950/70 p-5 shadow-[0_0_70px_rgba(59,130,246,0.16)] backdrop-blur-xl sm:p-6">
        <button
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/70 hover:bg-cyan-300/10 hover:text-cyan-100"
          onClick={onBackToHub}
          type="button"
        >
          허브로 돌아가기
        </button>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Formative Assessment
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">
              {concept.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              한 화면에 한 문항씩 제시됩니다. 선택형은 버튼으로 응답하고, 배열형과
              결과 흐름형은 카드를 골라 구조를 완성합니다.
            </p>
          </div>
          <ProgressPanel
            currentIndex={currentIndex}
            score={score}
            total={concept.questions.length}
          />
        </div>
      </div>

      <article className="rounded-lg border border-white/10 bg-slate-950/72 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-cyan-300">
              {currentIndex + 1}번 · {getQuestionScreenLabel(question, currentIndex)}
            </p>
            <h3 className="mt-2 text-xl font-bold leading-8 text-white">
              {question.prompt}
            </h3>
          </div>
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200">
            {currentIndex + 1}/{concept.questions.length}
          </span>
        </div>

        {question.type === 'ordering' ? (
          <OrderingQuestion
            disabled={submitted}
            onMove={moveChoice}
            onRemove={(choiceId) =>
              setOrderedChoiceIds((current) =>
                current.filter((currentChoiceId) => currentChoiceId !== choiceId),
              )
            }
            onReset={() => setOrderedChoiceIds([])}
            onSelect={(choiceId) =>
              setOrderedChoiceIds((current) =>
                current.includes(choiceId) ? current : [...current, choiceId],
              )
            }
            orderedChoiceIds={orderedChoiceIds}
            question={question}
          />
        ) : question.type === 'branching' ? (
          <BranchingQuestion
            disabled={submitted}
            onRemove={(slotKey) =>
              setBranchingSlots((current) => ({ ...current, [slotKey]: null }))
            }
            onReset={() => setBranchingSlots(createEmptyBranchingSlots())}
            onSelect={(card) =>
              setBranchingSlots((current) => {
                const targetKey = branchingSlotKeys.find(
                  (slotKey) => current[slotKey] === null,
                );
                return targetKey ? { ...current, [targetKey]: card } : current;
              })
            }
            question={question}
            slots={branchingSlots}
          />
        ) : (
          <ChoiceQuestion
            disabled={submitted}
            onSelect={setSelectedChoiceId}
            question={question}
            selectedChoiceId={selectedChoiceId}
          />
        )}

        {submitted ? (
          <>
            <FeedbackCard isCorrect={isCorrect} items={feedbackItems} />
            {!isCorrect ? (
              <button
                className="mt-3 rounded-md border border-rose-200/40 bg-rose-950/25 px-4 py-2 text-sm font-bold text-rose-100 transition hover:border-rose-100 hover:bg-rose-200/10 hover:text-white"
                onClick={retryQuestion}
                type="button"
              >
                다시 풀어보기
              </button>
            ) : null}
          </>
        ) : null}
      </article>

      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-300">
          {submitted
            ? isLastQuestion
              ? '마지막 문항입니다. 완료하면 허브에서 체크 표시가 나타납니다.'
              : '피드백을 확인한 뒤 다음 문항으로 이동하세요.'
            : '응답을 선택하거나 카드를 배치한 뒤 결과를 확인하세요.'}
        </p>
        {submitted ? (
          <button
            className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            onClick={goNext}
            type="button"
          >
            {isLastQuestion
              ? '완료하고 허브로 돌아가기'
              : isCorrect
                ? '다음 문제'
                : '다음 문제로 넘어가기'}
          </button>
        ) : (
          <button
            className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition enabled:hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={!canSubmit}
            onClick={submitAnswer}
            type="button"
          >
            결과 확인
          </button>
        )}
      </div>
    </section>
  );
}

function ProgressPanel({
  currentIndex,
  score,
  total,
}: {
  currentIndex: number;
  score: number;
  total: number;
}) {
  const progress = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-100">
        <span>문항 진행률</span>
        <span>{currentIndex + 1}/{total}</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-900/80">
        <div
          className="h-full rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.72)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        현재까지 정답 {score}개
      </p>
    </div>
  );
}

function getQuestionScreenLabel(question: ConceptQuestion, currentIndex: number) {
  return question.type === 'branching'
    ? '결과 흐름 완성하기'
    : friendlyFlowLabels[currentIndex];
}

function getSelectedAnswerText(
  question: ConceptQuestion,
  selectedChoiceId: string | null,
  orderedChoiceIds: string[],
  branchingSlots: BranchingSlots,
) {
  if (question.type === 'branching') {
    return [
      `시작: ${branchingSlots.start ?? ''}`,
      `확률적 결정: ${branchingSlots.middle ?? ''}`,
      `결과 A: ${branchingSlots.leftResult ?? ''}`,
      `결과 B: ${branchingSlots.rightResult ?? ''}`,
    ].join(' / ');
  }

  if (question.type === 'ordering') {
    const choiceById = new Map(
      question.choices.map((choice) => [choice.id, choice.text]),
    );
    return orderedChoiceIds
      .map((choiceId) => choiceById.get(choiceId) ?? choiceId)
      .join(' → ');
  }

  return (
    question.choices.find((choice) => choice.id === selectedChoiceId)?.text ??
    selectedChoiceId ??
    ''
  );
}

function ChoiceQuestion({
  disabled,
  onSelect,
  question,
  selectedChoiceId,
}: {
  disabled: boolean;
  onSelect: (choiceId: string) => void;
  question: ChoiceConceptQuestion;
  selectedChoiceId: string | null;
}) {
  const isOx = question.type === 'ox';

  return (
    <div className={`mt-6 grid gap-3 ${isOx ? 'sm:grid-cols-2' : ''}`}>
      {question.choices.map((choice) => {
        const selected = selectedChoiceId === choice.id;

        return (
          <button
            className={`rounded-lg border p-4 text-left text-sm font-semibold leading-6 transition ${
              selected
                ? 'border-cyan-300 bg-cyan-300/12 text-cyan-50 shadow-[0_0_18px_rgba(103,232,249,0.18)]'
                : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/60 hover:bg-cyan-300/8'
            }`}
            disabled={disabled}
            key={choice.id}
            onClick={() => onSelect(choice.id)}
            type="button"
          >
            {choice.text}
          </button>
        );
      })}
    </div>
  );
}

function OrderingQuestion({
  disabled,
  onMove,
  onRemove,
  onReset,
  onSelect,
  orderedChoiceIds,
  question,
}: {
  disabled: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (choiceId: string) => void;
  onReset: () => void;
  onSelect: (choiceId: string) => void;
  orderedChoiceIds: string[];
  question: OrderingConceptQuestion;
}) {
  const choiceById = new Map(question.choices.map((choice) => [choice.id, choice]));
  const availableChoices = question.choices.filter(
    (choice) => !orderedChoiceIds.includes(choice.id),
  );

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-100">순서 배열 카드</p>
          <button
            className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-bold text-slate-200 transition enabled:hover:border-cyan-300/60 enabled:hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-500"
            disabled={disabled || orderedChoiceIds.length === 0}
            onClick={onReset}
            type="button"
          >
            초기화
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {availableChoices.map((choice) => (
            <button
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 p-3 text-left text-sm font-semibold leading-6 text-slate-200 transition hover:border-cyan-300/60 hover:bg-cyan-300/8 hover:text-cyan-50 disabled:cursor-not-allowed disabled:text-slate-500"
              disabled={disabled}
              key={choice.id}
              onClick={() => onSelect(choice.id)}
              type="button"
            >
              {choice.text}
            </button>
          ))}
          {availableChoices.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 bg-slate-950/50 p-3 text-sm text-slate-400">
              모든 카드를 나의 배열에 넣었습니다.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
        <p className="text-sm font-bold text-slate-100">나의 배열</p>
        <div className="mt-4 space-y-2">
          {orderedChoiceIds.map((choiceId, index) => {
            const choice = choiceById.get(choiceId);
            if (!choice) return null;

            return (
              <div
                className="flex flex-col gap-3 rounded-lg border border-cyan-300/50 bg-cyan-300/10 p-3 sm:flex-row sm:items-center sm:justify-between"
                key={choice.id}
              >
                <button
                  className="flex flex-1 items-start gap-3 text-left"
                  disabled={disabled}
                  onClick={() => onRemove(choice.id)}
                  type="button"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-sm font-bold text-slate-950">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-cyan-50">
                    {choice.text}
                  </span>
                </button>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-cyan-300/25 bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-200 transition enabled:hover:border-cyan-300 enabled:hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-500"
                    disabled={disabled || index === 0}
                    onClick={() => onMove(index, index - 1)}
                    type="button"
                  >
                    위
                  </button>
                  <button
                    className="rounded-md border border-cyan-300/25 bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-200 transition enabled:hover:border-cyan-300 enabled:hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-500"
                    disabled={disabled || index === orderedChoiceIds.length - 1}
                    onClick={() => onMove(index, index + 1)}
                    type="button"
                  >
                    아래
                  </button>
                </div>
              </div>
            );
          })}
          {orderedChoiceIds.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 bg-white/5 p-3 text-sm text-slate-400">
              왼쪽 카드를 클릭하면 이곳에 순서대로 들어갑니다.
            </p>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-slate-400">
          나의 배열에 들어간 카드를 다시 클릭하면 제거할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function BranchingQuestion({
  disabled,
  onRemove,
  onReset,
  onSelect,
  question,
  slots,
}: {
  disabled: boolean;
  onRemove: (slotKey: BranchingSlotKey) => void;
  onReset: () => void;
  onSelect: (card: string) => void;
  question: BranchingConceptQuestion;
  slots: BranchingSlots;
}) {
  const availableCards = question.cards.filter(
    (card) => !Object.values(slots).includes(card),
  );
  const hasSelectedCards = branchingSlotKeys.some((key) => slots[key] !== null);

  const slotLabels: Record<BranchingSlotKey, string> = {
    start: '시작',
    middle: '확률적 결정',
    leftResult: '결과 A',
    rightResult: '결과 B',
  };

  const renderSlot = (slotKey: BranchingSlotKey) => {
    const card = slots[slotKey];

    return (
      <button
        className={`min-h-24 w-full rounded-lg border p-4 text-center transition ${
          card
            ? 'border-cyan-300/60 bg-cyan-300/12 text-cyan-50 shadow-[0_0_18px_rgba(103,232,249,0.16)]'
            : 'border-dashed border-white/20 bg-white/5 text-slate-400'
        }`}
        disabled={disabled || !card}
        onClick={() => onRemove(slotKey)}
        type="button"
      >
        <span className="block text-xs font-bold uppercase tracking-wide text-cyan-300">
          {slotLabels[slotKey]}
        </span>
        <span className="mt-2 block text-sm font-semibold leading-6">
          {card ?? '카드를 선택하세요'}
        </span>
      </button>
    );
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-100">결과 카드</p>
          <button
            className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-bold text-slate-200 transition enabled:hover:border-cyan-300/60 enabled:hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-500"
            disabled={disabled || !hasSelectedCards}
            onClick={onReset}
            type="button"
          >
            초기화
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {availableCards.map((card) => (
            <button
              className="rounded-lg border border-white/10 bg-slate-950/60 p-3 text-left text-sm font-semibold leading-6 text-slate-200 transition hover:border-cyan-300/60 hover:bg-cyan-300/8 hover:text-cyan-50 disabled:cursor-not-allowed disabled:text-slate-500"
              disabled={disabled}
              key={card}
              onClick={() => onSelect(card)}
              type="button"
            >
              {card}
            </button>
          ))}
          {availableCards.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 bg-slate-950/50 p-3 text-sm text-slate-400 sm:col-span-2">
              모든 카드를 결과 흐름에 넣었습니다.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
        <p className="text-sm font-bold text-slate-100">나의 결과 흐름</p>
        <div className="mx-auto mt-4 max-w-2xl">
          <div className="mx-auto max-w-sm">{renderSlot('start')}</div>
          <div
            aria-hidden="true"
            className="mx-auto h-8 w-px bg-cyan-200/80"
          />
          <div className="mx-auto max-w-sm">{renderSlot('middle')}</div>
          <div className="mx-auto h-16 max-w-xl px-8 text-cyan-200 sm:px-10">
            <svg
              aria-hidden="true"
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 400 80"
            >
              <path
                d="M200 0 V26 M200 26 L100 80 M200 26 L300 80"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
              />
            </svg>
          </div>
          <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:gap-4">
            {renderSlot('leftResult')}
            {renderSlot('rightResult')}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          카드를 클릭하면 시작, 확률적 결정, 결과 A, 결과 B 순서로 들어갑니다.
          배치한 카드를 다시 클릭하면 제거할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function FeedbackCard({
  isCorrect,
  items,
}: {
  isCorrect: boolean;
  items: string[];
}) {
  return (
    <div
      className={`mt-6 rounded-lg border p-4 ${
        isCorrect
          ? 'border-emerald-300/40 bg-emerald-300/10 shadow-[0_0_28px_rgba(16,185,129,0.18)]'
          : 'border-rose-300/40 bg-rose-300/10 shadow-[0_0_28px_rgba(244,63,94,0.16)]'
      }`}
    >
      <p
        className={`text-sm font-bold ${
          isCorrect ? 'text-emerald-200' : 'text-rose-200'
        }`}
      >
        {isCorrect ? '정답 피드백' : '오답 피드백'}
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p className="text-sm leading-6 text-slate-200" key={item}>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function getFeedbackItems(
  question: ConceptQuestion,
  selectedChoiceId: string | null,
  orderedChoiceIds: string[],
  isCorrect: boolean,
) {
  if (isCorrect) {
    return [question.correctFeedback];
  }

  if (question.type === 'branching') {
    return [
      question.wrongFeedbacks.general ??
        '결과 흐름을 다시 확인하세요. 결과 A와 결과 B는 순차적 사건이 아니라 병렬적 결과입니다.',
    ];
  }

  if (selectedChoiceId) {
    return [
      question.wrongFeedbacks[selectedChoiceId] ??
        '선택한 답을 다시 확인하세요. 고전적 직관과 양자역학에서의 확률 설명을 구분해야 합니다.',
    ];
  }

  if (question.type === 'ordering' && Array.isArray(question.correctAnswer)) {
    if (question.wrongFeedbacks.general) {
      return [question.wrongFeedbacks.general];
    }

    const misplacedChoiceIds = orderedChoiceIds.filter(
      (choiceId, index) => question.correctAnswer[index] !== choiceId,
    );
    const uniqueFeedbacks = Array.from(
      new Set(
        misplacedChoiceIds.map(
          (choiceId) =>
            question.wrongFeedbacks[choiceId] ??
            '배열 순서를 다시 확인하세요. 고전적 순서 직관과 양자 현상의 관찰 과정을 구분해야 합니다.',
        ),
      ),
    );

    return uniqueFeedbacks.length > 0
      ? uniqueFeedbacks
      : ['배열 순서를 다시 확인하세요.'];
  }

  return ['응답을 다시 확인하세요.'];
}
