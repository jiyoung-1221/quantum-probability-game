export type StudentClass = '햇님반' | '달님반' | '별님반' | '구름반' | '무지개반';

export type StudentAnswerRecord = {
  areaId: string;
  areaTitle: string;
  questionId: string;
  prompt: string;
  selectedAnswer: string;
  isCorrect: boolean;
  retried: boolean;
  answeredAt: string;
};

export type ResultSubmissionStatus =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'error';

export type ResultSubmissionPayload = {
  studentId: string;
  studentClass: StudentClass;
  studentNumber: number;
  totalCorrect: number;
  totalQuestions: number;
  completedAreas: string[];
  answers: StudentAnswerRecord[];
};
