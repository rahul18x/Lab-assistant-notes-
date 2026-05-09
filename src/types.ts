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

export interface Reminder {
  id: string;
  topicId?: string;
  topicTitle?: string;
  time: number; // ISO string
  message: string;
  triggered: boolean;
}

export interface ModelPaper {
  id: string;
  year: string;
  title: string;
  description: string;
}
