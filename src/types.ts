export type ProgrammingLanguage = 'python' | 'cpp' | 'java' | 'javascript';
export type TemplateCategory = 'basics' | 'conditionals' | 'loops' | 'algorithms' | 'practical';

export interface Diagram {
  id: string;
  userId?: string;
  title: string;
  filename: string;
  language: ProgrammingLanguage;
  sourceCode: string;
  mermaidSyntax: string;
  complexity: string;
  statusBadge: string;
  nodeCount: number;
  edgeCount: number;
  category: string;
  pipelineNodes: Array<{
    icon: string;
    label: string;
    type: 'start' | 'decision' | 'process' | 'end';
  }>;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
  isDeleted?: boolean;
  nodes?: import('./types').ASTNode[];
}

export type TemplateStyle = 'ieee' | 'formal' | 'minimal';
export type AppLanguage = 'es' | 'en';
export type DiagramLanguage = 'es' | 'en';

export interface AcademicSettings {
  studentName: string;
  studentId: string;
  subject: string;
  professor: string;
  templateStyle: TemplateStyle;
  autoTimestamp: boolean;
  appLanguage?: AppLanguage;
  diagramLanguage?: DiagramLanguage;
}

export type ExportFormat = 'pdf' | 'docx' | 'image' | 'svg';

export interface ASTNode {
  id: string;
  type: 'start' | 'process' | 'decision' | 'loop' | 'end' | 'call' | 'io' | 'block_end';
  label: string;
  details?: string;
}

export interface ASTEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ParseResult {
  mermaidSyntax: string;
  nodes: ASTNode[];
  edges: ASTEdge[];
  nodeCount: number;
  edgeCount: number;
  complexity: string;
  parseTimeMs: number;
}

export type ActiveTab = 'dashboard' | 'editor' | 'templates' | 'settings';

export interface FlowTemplate {
  id: string;
  titleKey: string;
  descriptionKey: string;
  category: TemplateCategory;
  supportedLanguages: ProgrammingLanguage[];
  sourceCode: Partial<Record<ProgrammingLanguage, string>>;
}
