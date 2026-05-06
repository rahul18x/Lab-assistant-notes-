export interface Topic {
  id: string;
  title: string;
  pageRange: string;
}

export interface StudyMaterial {
  topicId: string;
  notes: string; // Markdown content
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
