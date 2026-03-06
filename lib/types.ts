export type Subject = 
  | 'Linguagens' 
  | 'Matemática' 
  | 'Ciências da Natureza' 
  | 'Ciências Humanas';

export interface QuestionRecord {
  id: string;
  date: string; // ISO string
  subject: Subject;
  topic: string;
  total: number;
  correct: number;
  wrong: number;
}
