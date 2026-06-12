export type QuestionType = 'ox' | 'ordering' | 'multiple' | 'branching';

export type ConceptChoice = {
  id: string;
  text: string;
};

export type BranchingAnswer = {
  start: string;
  middle: string;
  leftResult: string;
  rightResult: string;
};

type ConceptQuestionBase = {
  id: string;
  flowLabel: string;
  prompt: string;
  correctFeedback: string;
};

export type ChoiceConceptQuestion = ConceptQuestionBase & {
  type: 'ox' | 'multiple';
  choices: ConceptChoice[];
  correctAnswer: string;
  wrongFeedbacks: Record<string, string>;
};

export type OrderingConceptQuestion = ConceptQuestionBase & {
  type: 'ordering';
  choices: ConceptChoice[];
  correctAnswer: string[];
  wrongFeedbacks: Record<string, string>;
};

export type BranchingConceptQuestion = ConceptQuestionBase & {
  type: 'branching';
  cards: string[];
  correctAnswer: BranchingAnswer;
  wrongFeedbacks: Record<string, string>;
};

export type ConceptQuestion =
  | ChoiceConceptQuestion
  | OrderingConceptQuestion
  | BranchingConceptQuestion;

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
