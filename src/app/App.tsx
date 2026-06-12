import { useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { conceptAreas } from '../data/concepts';
import { AssessmentGame } from '../features/assessment/AssessmentGame';
import { ConceptHub } from '../features/hub/ConceptHub';
import type {
  ResultSubmissionPayload,
  ResultSubmissionStatus,
  StudentAnswerRecord,
  StudentClass,
} from '../types/result';

const resultSubmissionUrl =
  'https://script.google.com/macros/s/AKfycbzjadFKC0N98eIRym3ydWLE9nctjiJbsp60FR8UhwQeegnxYcTxjNq5ryHp41csvpsL/exec';

const csvColumns = [
  'studentId',
  'studentClass',
  'studentNumber',
  'areaId',
  'areaTitle',
  'questionId',
  'prompt',
  'selectedAnswer',
  'isCorrect',
  'retried',
  'answeredAt',
];

export function App() {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [completedConceptIds, setCompletedConceptIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [studentClass, setStudentClass] = useState<StudentClass | ''>('');
  const [studentNumber, setStudentNumber] = useState<number | ''>('');
  const [answerRecords, setAnswerRecords] = useState<StudentAnswerRecord[]>([]);
  const [submissionStatus, setSubmissionStatus] =
    useState<ResultSubmissionStatus>('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');

  const selectedConcept = useMemo(
    () => conceptAreas.find((concept) => concept.id === selectedConceptId),
    [selectedConceptId],
  );

  const markComplete = (conceptId: string) => {
    const nextCompletedConceptIds = new Set(completedConceptIds).add(conceptId);

    setCompletedConceptIds(nextCompletedConceptIds);
    setSelectedConceptId(null);

    if (
      completedConceptIds.size < conceptAreas.length &&
      nextCompletedConceptIds.size === conceptAreas.length
    ) {
      setIsCelebrationOpen(true);
    }
  };

  const restartExploration = () => {
    setCompletedConceptIds(new Set());
    setSelectedConceptId(null);
    setIsCelebrationOpen(false);
    setAnswerRecords([]);
    setSubmissionStatus('idle');
    setSubmissionMessage('');
  };

  const completedAreas = conceptAreas
    .filter((concept) => completedConceptIds.has(concept.id))
    .map((concept) => concept.title);
  const totalQuestions = conceptAreas.reduce(
    (total, concept) => total + concept.questions.length,
    0,
  );
  const totalCorrect = countLatestCorrectAnswers(answerRecords);

  const updateStudentClass = (nextStudentClass: StudentClass | '') => {
    setStudentClass(nextStudentClass);
    setSubmissionStatus('idle');
    setSubmissionMessage('');
  };

  const updateStudentNumber = (nextStudentNumber: number | '') => {
    setStudentNumber(nextStudentNumber);
    setSubmissionStatus('idle');
    setSubmissionMessage('');
  };

  const buildSubmissionPayload = (): ResultSubmissionPayload | null => {
    if (!studentClass || !studentNumber) {
      setSubmissionStatus('idle');
      setSubmissionMessage('반과 번호를 먼저 선택해주세요.');
      return null;
    }

    return {
      studentId: `${studentClass}-${studentNumber}번`,
      studentClass,
      studentNumber,
      totalCorrect,
      totalQuestions,
      completedAreas,
      answers: answerRecords,
    };
  };

  const submitResults = async () => {
    const payload = buildSubmissionPayload();
    if (!payload) return;

    setSubmissionStatus('submitting');
    setSubmissionMessage('제출 중...');

    try {
      const response = await fetch(resultSubmissionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Submission failed with ${response.status}`);
      }

      setSubmissionStatus('success');
      setSubmissionMessage('제출이 완료되었습니다.');
    } catch {
      setSubmissionStatus('error');
      setSubmissionMessage(
        '제출에 실패했습니다. CSV를 다운로드해 제출해주세요.',
      );
    }
  };

  const downloadCsv = () => {
    const payload = buildSubmissionPayload();
    if (!payload) return;

    const csv = createCsv(payload);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantum-probability-result-${payload.studentId}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      {selectedConcept ? (
        <AssessmentGame
          concept={selectedConcept}
          onBackToHub={() => setSelectedConceptId(null)}
          onComplete={() => markComplete(selectedConcept.id)}
          onRecordAnswer={(record) =>
            setAnswerRecords((current) => [...current, record])
          }
        />
      ) : (
        <ConceptHub
          answerCount={answerRecords.length}
          completedConceptIds={completedConceptIds}
          concepts={conceptAreas}
          onDownloadCsv={downloadCsv}
          isCelebrationOpen={isCelebrationOpen}
          onCloseCelebration={() => setIsCelebrationOpen(false)}
          onRestartExploration={restartExploration}
          onSelectConcept={setSelectedConceptId}
          onStudentClassChange={updateStudentClass}
          onStudentNumberChange={updateStudentNumber}
          onSubmitResults={() => {
            void submitResults();
          }}
          studentClass={studentClass}
          studentNumber={studentNumber}
          submissionMessage={submissionMessage}
          submissionStatus={submissionStatus}
          totalCorrect={totalCorrect}
          totalQuestions={totalQuestions}
        />
      )}
    </AppLayout>
  );
}

function countLatestCorrectAnswers(answerRecords: StudentAnswerRecord[]) {
  const latestByQuestionId = new Map<string, StudentAnswerRecord>();

  answerRecords.forEach((record) => {
    latestByQuestionId.set(record.questionId, record);
  });

  return [...latestByQuestionId.values()].filter((record) => record.isCorrect)
    .length;
}

function createCsv(payload: ResultSubmissionPayload) {
  const rows = payload.answers.map((answer) => [
    payload.studentId,
    payload.studentClass,
    payload.studentNumber,
    answer.areaId,
    answer.areaTitle,
    answer.questionId,
    answer.prompt,
    answer.selectedAnswer,
    answer.isCorrect,
    answer.retried,
    answer.answeredAt,
  ]);

  return [csvColumns, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');
}

function escapeCsvValue(value: string | number | boolean) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
