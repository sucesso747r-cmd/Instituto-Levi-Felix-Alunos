export type Belt = 'Branca' | 'Amarela' | 'Vermelha' | 'Laranja' | 'Verde' | 'Roxa' | 'Marrom' | 'Preta';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'sensei';
  currentBelt: Belt;
  class?: string;
}

export interface ExamStatus {
  isEligible: boolean;
  examDate: string;
  senseiName: string;
  deadlineDate: string;
  registrationStatus?: 'PENDENTE' | 'CONFIRMADO' | 'NENHUM';
}

export interface StudentExamInfo {
  id: string;
  name: string;
  class: string;
  currentBelt: Belt;
  intendedBelt: Belt;
  isEligible: boolean;
  registrationStatus: 'S' | 'N' | 'PENDENCIA';
}

export interface ExamSettings {
  isActive: boolean;
  examDate: string;
  deadlineDate: string;
}
