export type QuestionType = 'ox' | 'ordering' | 'multiple';

export type ConceptChoice = {
  id: string;
  text: string;
};

export type ConceptQuestion = {
  id: string;
  type: QuestionType;
  flowLabel: string;
  prompt: string;
  choices: ConceptChoice[];
  correctAnswer: string | string[];
  correctFeedback: string;
  wrongFeedbacks: Record<string, string>;
};

export type ConceptArea = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  classroomGoal: string;
  activityLabel: string;
  color: 'blue' | 'green' | 'orange' | 'violet';
  questions: ConceptQuestion[];
};
