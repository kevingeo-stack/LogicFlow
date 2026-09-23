import { describe, it, expect } from 'vitest';
import { LegacyAdapter } from '../../parsers/legacy/LegacyAdapter';
import { CodeParser } from '../../core/CodeParser';

describe('LegacyAdapter', () => {
  it('should adapt Legacy CodeParser output to FlowGraph', () => {
    const legacyParser = new CodeParser();
    const sampleCode = `
def check_age(age):
    if age >= 18:
        print("Adult")
    else:
        print("Minor")
    return True
    `;
    
    // 1. Run legacy parser
    const parseResult = legacyParser.parse(sampleCode, 'python');
    
    // 2. Adapt to new agnostic domain
    const graph = LegacyAdapter.adapt(parseResult);
    
    // 3. Assertions
    const nodes = graph.getNodes();
    const edges = graph.getEdges();
    
    expect(nodes.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
    
    // Verify node types were mapped correctly
    const hasDecision = nodes.some(n => n.type === 'decision');
    const hasProcess = nodes.some(n => n.type === 'process');
    const hasStart = nodes.some(n => n.type === 'start');
    
    expect(hasDecision).toBe(true);
    expect(hasProcess).toBe(true);
    expect(hasStart).toBe(true);
    
    // Original mermaid syntax should still be available in parseResult (backwards compatibility)
    expect(parseResult.mermaidSyntax).toContain('flowchart TD');
  });
});
