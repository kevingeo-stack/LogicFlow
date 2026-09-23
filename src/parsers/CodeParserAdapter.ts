import { FlowGraph } from '../domain/FlowGraph';
import { LanguageId } from '../domain/Language';

export interface ParseOutput {
  success: boolean;
  graph: FlowGraph;
  language: LanguageId;
  ast?: unknown; // Agnostic to the actual AST used
  errors: Array<{ message: string; line?: number }>;
  warnings: Array<{ message: string; line?: number }>;
  parserVersion: string;
}

export interface CodeParserAdapter {
  parse(code: string): ParseOutput;
}
