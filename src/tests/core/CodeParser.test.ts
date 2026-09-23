import { describe, it, expect, beforeEach } from 'vitest';
import { CodeParser } from '../../core/CodeParser';

describe('CodeParser - CFG Topology Tests', () => {
  let parser: CodeParser;

  beforeEach(() => {
    parser = new CodeParser();
  });

  const getEdge = (edges: any[], from: string, to: string) => 
    edges.find(e => e.from === from && e.to === to);

  it('Test 1 - Linear Sequence', () => {
    const code = `
def main():
  x = 1
  y = 2
  print(x + y)
    `.trim();
    const result = parser.parse(code, 'python');
    
    // Start, x=1, y=2, print, End_Complete = 5 nodes
    expect(result.nodeCount).toBe(5); 
    
    const startNode = result.nodes.find(n => n.type === 'start');
    expect(startNode).toBeDefined();

    const endNode = result.nodes.find(n => n.type === 'end');
    expect(endNode).toBeDefined(); // End_Complete

    // Check that there are no block_end nodes since there are no blocks
    expect(result.nodes.filter(n => n.type === 'block_end').length).toBe(0);
  });

  it('Test 2 - IF + ELSE (Convergence)', () => {
    const code = `
def main():
  if x > 5:
    A = 1
  else:
    B = 2
  C = 3
    `.trim();
    const result = parser.parse(code, 'python');
    
    const condNode = result.nodes.find(n => n.type === 'decision');
    const nodeA = result.nodes.find(n => n.label === 'A = 1');
    const nodeB = result.nodes.find(n => n.label === 'B = 2');
    const nodeC = result.nodes.find(n => n.label === 'C = 3');

    expect(condNode).toBeDefined();
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();
    expect(nodeC).toBeDefined();

    // Check branches
    expect(getEdge(result.edges, condNode!.id, nodeA!.id)?.label).toBe('true');
    expect(getEdge(result.edges, condNode!.id, nodeB!.id)?.label).toBe('false');

    // Check convergence
    expect(getEdge(result.edges, nodeA!.id, nodeC!.id)).toBeDefined();
    expect(getEdge(result.edges, nodeB!.id, nodeC!.id)).toBeDefined();

    // Check block_end metadata
    const blockEnds = result.nodes.filter(n => n.type === 'block_end');
    expect(blockEnds.length).toBe(2);
    expect(blockEnds[0].details).toBe('else');
    expect(blockEnds[1].details).toBe('if');
    // Ensure block_end doesn't alter nodeCount
    expect(result.nodeCount).toBe(result.nodes.length - 2);
  });

  it('Test 3 - IF without ELSE (Convergence)', () => {
    const code = `
def main():
  if x > 5:
    A = 1
  B = 2
    `.trim();
    const result = parser.parse(code, 'python');
    
    const condNode = result.nodes.find(n => n.type === 'decision');
    const nodeA = result.nodes.find(n => n.label === 'A = 1');
    const nodeB = result.nodes.find(n => n.label === 'B = 2');

    expect(condNode).toBeDefined();
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();

    // Check branch and bypass
    expect(getEdge(result.edges, condNode!.id, nodeA!.id)?.label).toBe('true');
    expect(getEdge(result.edges, condNode!.id, nodeB!.id)?.label).toBe('false'); // False branch goes straight to B
    expect(getEdge(result.edges, nodeA!.id, nodeB!.id)).toBeDefined(); // True branch converges to B

    // Check block_end
    const blockEnds = result.nodes.filter(n => n.type === 'block_end');
    expect(blockEnds.length).toBe(1);
    expect(blockEnds[0].details).toBe('if');
  });

  it('Test 4 - WHILE (Back-edge)', () => {
    const code = `
def main():
  while x > 0:
    x = x - 1
  print(x)
    `.trim();
    const result = parser.parse(code, 'python');

    const loopNode = result.nodes.find(n => n.type === 'loop');
    const bodyNode = result.nodes.find(n => n.label === 'x = x - 1');
    const nextNode = result.nodes.find(n => n.label === 'print(x)');

    expect(loopNode).toBeDefined();
    expect(bodyNode).toBeDefined();
    expect(nextNode).toBeDefined();

    // Enter body
    expect(getEdge(result.edges, loopNode!.id, bodyNode!.id)?.label).toBe('true');
    
    // Back-edge
    expect(getEdge(result.edges, bodyNode!.id, loopNode!.id)).toBeDefined();

    // Exit loop
    expect(getEdge(result.edges, loopNode!.id, nextNode!.id)?.label).toBe('false');

    // Check block_end
    const blockEnds = result.nodes.filter(n => n.type === 'block_end');
    expect(blockEnds.length).toBe(1);
    expect(blockEnds[0].details).toBe('while');
  });

  it('Test 5 - FOR loop (Back-edge)', () => {
    const code = `
def main():
  for i in range(5):
    print(i)
  end()
    `.trim();
    const result = parser.parse(code, 'python');

    const loopNode = result.nodes.find(n => n.type === 'loop');
    const bodyNode = result.nodes.find(n => n.label === 'print(i)');
    const nextNode = result.nodes.find(n => n.label === 'end()');

    expect(loopNode).toBeDefined();
    expect(bodyNode).toBeDefined();
    expect(nextNode).toBeDefined();

    expect(getEdge(result.edges, loopNode!.id, bodyNode!.id)?.label).toBe('true');
    expect(getEdge(result.edges, bodyNode!.id, loopNode!.id)).toBeDefined();
    expect(getEdge(result.edges, loopNode!.id, nextNode!.id)?.label).toBe('false');
  });

  it('Test 6 - Semantic Types', () => {
    const code = `
def main():
  if x:
    print(x)
  while y:
    y = y - 1
    `.trim();
    const result = parser.parse(code, 'python');

    expect(result.nodes.find(n => n.label === 'print(x)')?.type).toBe('io');
    expect(result.nodes.find(n => n.label === 'y = y - 1')?.type).toBe('process');
    expect(result.nodes.find(n => n.type === 'decision')).toBeDefined();
    expect(result.nodes.find(n => n.type === 'loop')).toBeDefined();
  });

  it('Test 7 - Return directly to END', () => {
    const code = `
def main():
  if x > 5:
    return True
  return False
    `.trim();
    const result = parser.parse(code, 'python');

    const retTrue = result.nodes.find(n => n.label === 'return True');
    const retFalse = result.nodes.find(n => n.label === 'return False');
    const endNode = result.nodes.find(n => n.type === 'end');

    expect(retTrue).toBeDefined();
    expect(retFalse).toBeDefined();
    expect(endNode).toBeDefined();

    // Both returns should connect to END directly
    expect(getEdge(result.edges, retTrue!.id, endNode!.id)).toBeDefined();
    expect(getEdge(result.edges, retFalse!.id, endNode!.id)).toBeDefined();
  });
});
