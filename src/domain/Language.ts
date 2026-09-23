export type SupportLevel = 'SUPPORTED' | 'PLANNED' | 'UNKNOWN';

export type LanguageId = 
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'unknown';

export interface LanguageInfo {
  id: LanguageId;
  name: string;
  supportLevel: SupportLevel;
}

export const LANGUAGES: Record<LanguageId, LanguageInfo> = {
  python: { id: 'python', name: 'Python', supportLevel: 'PLANNED' },
  javascript: { id: 'javascript', name: 'JavaScript', supportLevel: 'PLANNED' },
  typescript: { id: 'typescript', name: 'TypeScript', supportLevel: 'PLANNED' },
  java: { id: 'java', name: 'Java', supportLevel: 'PLANNED' },
  c: { id: 'c', name: 'C', supportLevel: 'PLANNED' },
  cpp: { id: 'cpp', name: 'C++', supportLevel: 'PLANNED' },
  csharp: { id: 'csharp', name: 'C#', supportLevel: 'PLANNED' },
  unknown: { id: 'unknown', name: 'Unknown', supportLevel: 'UNKNOWN' }
};
