export type ExerciseData = {
  id: string;
  kind: "symbolic" | "wolfram";
  prompt: string;
  answer: string;
  explanation: string;
  hints: string[];
  starter?: string;
  assumptions?: Record<string, boolean>;
};
export type LessonContent = {
  objectives: string[];
  theory: string[];
  formula: string;
  steps: string[];
  mistakes: string[];
  wolfram?: string;
  comparison?: string[];
};
export type LessonData = {
  id: string;
  track: "math" | "wolfram" | "combined";
  module: string;
  title: string;
  description: string;
  minutes: number;
  content: LessonContent;
  exercises: ExerciseData[];
};
