export type FlowNodeType =
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'loop'
  | 'io'
  | 'connector'
  | 'subprocess';

export type FlowEdgeType = 'default' | 'true' | 'false' | 'exception';

export interface SourceLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
