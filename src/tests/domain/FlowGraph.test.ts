import { describe, it, expect } from 'vitest';
import { FlowGraph } from '../../domain/FlowGraph';

describe('FlowGraph Domain', () => {
  it('should represent a simple linear flow: Start -> Process -> End', () => {
    const graph = new FlowGraph();
    
    graph.addNode({ id: 'start', type: 'start', label: 'Start' });
    graph.addNode({ id: 'process1', type: 'process', label: 'Do something' });
    graph.addNode({ id: 'end', type: 'end', label: 'End' });
    
    graph.addEdge({ id: 'e1', source: 'start', target: 'process1', type: 'default' });
    graph.addEdge({ id: 'e2', source: 'process1', target: 'end', type: 'default' });
    
    expect(graph.getNodes().length).toBe(3);
    expect(graph.getEdges().length).toBe(2);
  });

  it('should represent a branching decision: Start -> Decision -> Process/End', () => {
    const graph = new FlowGraph();
    
    graph.addNode({ id: 'start', type: 'start', label: 'Start' });
    graph.addNode({ id: 'decision', type: 'decision', label: 'Is valid?' });
    graph.addNode({ id: 'process', type: 'process', label: 'Process valid' });
    graph.addNode({ id: 'end', type: 'end', label: 'End' });
    
    graph.addEdge({ id: 'e1', source: 'start', target: 'decision', type: 'default' });
    graph.addEdge({ id: 'e2', source: 'decision', target: 'process', type: 'true', label: 'true' });
    graph.addEdge({ id: 'e3', source: 'decision', target: 'end', type: 'false', label: 'false' });
    
    const decisionEdges = graph.getEdges().filter(e => e.source === 'decision');
    expect(decisionEdges.length).toBe(2);
    expect(decisionEdges.some(e => e.type === 'true')).toBe(true);
    expect(decisionEdges.some(e => e.type === 'false')).toBe(true);
  });

  it('should enforce unique node IDs', () => {
    const graph = new FlowGraph();
    graph.addNode({ id: 'n1', type: 'start', label: 'Start' });
    
    expect(() => {
      graph.addNode({ id: 'n1', type: 'process', label: 'Duplicate' });
    }).toThrow(/already exists/);
  });

  it('should prevent edges pointing to non-existent nodes', () => {
    const graph = new FlowGraph();
    graph.addNode({ id: 'n1', type: 'start', label: 'Start' });
    
    expect(() => {
      graph.addEdge({ id: 'e1', source: 'n1', target: 'n2', type: 'default' });
    }).toThrow(/does not exist/);
  });

  it('should preserve SourceLocation metadata', () => {
    const graph = new FlowGraph();
    const source = { startLine: 1, startColumn: 0, endLine: 1, endColumn: 20 };
    
    graph.addNode({ 
      id: 'n1', 
      type: 'process', 
      label: 'process', 
      source 
    });
    
    const node = graph.getNode('n1');
    expect(node?.source).toEqual(source);
  });
});
