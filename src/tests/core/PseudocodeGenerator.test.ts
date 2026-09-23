import { describe, it, expect } from 'vitest';
import { generatePseudocode } from '../../core/PseudocodeGenerator';
import { ASTNode } from '../../types';

describe('PseudocodeGenerator', () => {
  it('Test 1 - Secuencia simple', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'process', label: 'A' },
      { id: '2', type: 'process', label: 'B' }
    ];
    const result = generatePseudocode(nodes, 'en');
    expect(result).toBe('A\nB');
  });

  it('Test 2 - IF', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'decision', label: 'x?' },
      { id: '2', type: 'process', label: 'A' },
      { id: '3', type: 'block_end', label: '', details: 'if' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('SI x ENTONCES\n    A\nFIN SI');
  });

  it('Test 3 - IF / ELSE', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'decision', label: 'x?' },
      { id: '2', type: 'process', label: 'A' },
      { id: '3', type: 'block_end', label: '', details: 'else' },
      { id: '4', type: 'process', label: 'B' },
      { id: '5', type: 'block_end', label: '', details: 'if' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('SI x ENTONCES\n    A\nSINO\n    B\nFIN SI');
  });

  it('Test 4 - IF anidado', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'decision', label: 'x?' },
      { id: '2', type: 'decision', label: 'y?' },
      { id: '3', type: 'process', label: 'A' },
      { id: '4', type: 'block_end', label: '', details: 'if' },
      { id: '5', type: 'process', label: 'B' },
      { id: '6', type: 'block_end', label: '', details: 'if' }
    ];
    const result = generatePseudocode(nodes, 'en');
    expect(result).toBe('IF x THEN\n    IF y THEN\n        A\n    END IF\n    B\nEND IF');
  });

  it('Test 5 - IF / ELSE anidado', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'decision', label: 'x?' },
      { id: '2', type: 'process', label: 'A' },
      { id: '3', type: 'decision', label: 'y?' },
      { id: '4', type: 'process', label: 'B' },
      { id: '5', type: 'block_end', label: '', details: 'else' },
      { id: '6', type: 'process', label: 'C' },
      { id: '7', type: 'block_end', label: '', details: 'if' },
      { id: '8', type: 'process', label: 'D' },
      { id: '9', type: 'block_end', label: '', details: 'if' },
      { id: '10', type: 'process', label: 'E' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('SI x ENTONCES\n    A\n    SI y ENTONCES\n        B\n    SINO\n        C\n    FIN SI\n    D\nFIN SI\nE');
  });

  it('Test 6 - ELIF', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'decision', label: 'x?' },
      { id: '2', type: 'process', label: 'A' },
      { id: '3', type: 'decision', label: 'y?', details: 'elif' },
      { id: '4', type: 'process', label: 'B' },
      { id: '5', type: 'block_end', label: '', details: 'if' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('SI x ENTONCES\n    A\nSINO SI y ENTONCES\n    B\nFIN SI');
  });

  it('Test 7 - WHILE', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'loop', label: 'x > 0', details: 'while' },
      { id: '2', type: 'process', label: 'x = x - 1' },
      { id: '3', type: 'block_end', label: '', details: 'while' }
    ];
    const result = generatePseudocode(nodes, 'en');
    expect(result).toBe('WHILE x > 0 DO\n    x = x - 1\nEND WHILE');
  });

  it('Test 8 - FOR', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'loop', label: 'i in array', details: 'for' },
      { id: '2', type: 'process', label: 'print i' },
      { id: '3', type: 'block_end', label: '', details: 'for' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('PARA i in array HACER\n    print i\nFIN PARA');
  });

  it('Test 9 - RETURN', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'process', label: 'return x' }
    ];
    const resultEn = generatePseudocode(nodes, 'en');
    const resultEs = generatePseudocode(nodes, 'es');
    expect(resultEn).toBe('RETURN x');
    expect(resultEs).toBe('RETORNAR x');
  });

  it('Test 10 - español', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'start', label: 'main()' },
      { id: '2', type: 'decision', label: 'a == b' },
      { id: '3', type: 'process', label: 'print a' },
      { id: '4', type: 'block_end', label: '', details: 'if' },
      { id: '5', type: 'end', label: '' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('INICIO main()\nSI a == b ENTONCES\n    print a\nFIN SI\nFIN');
  });

  it('Test 11 - inglés', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'start', label: 'main()' },
      { id: '2', type: 'decision', label: 'a == b' },
      { id: '3', type: 'process', label: 'print a' },
      { id: '4', type: 'block_end', label: '', details: 'if' },
      { id: '5', type: 'end', label: '' }
    ];
    const result = generatePseudocode(nodes, 'en');
    expect(result).toBe('START main()\nIF a == b THEN\n    print a\nEND IF\nEND');
  });

  it('Test 12 - mezcla de bloques', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'decision', label: 'a' },
      { id: '2', type: 'loop', label: 'b', details: 'while' },
      { id: '3', type: 'decision', label: 'c' },
      { id: '4', type: 'process', label: 'do it' },
      { id: '5', type: 'block_end', label: '', details: 'if' },
      { id: '6', type: 'block_end', label: '', details: 'while' },
      { id: '7', type: 'block_end', label: '', details: 'else' },
      { id: '8', type: 'process', label: 'else body' },
      { id: '9', type: 'block_end', label: '', details: 'if' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('SI a ENTONCES\n    MIENTRAS b HACER\n        SI c ENTONCES\n            do it\n        FIN SI\n    FIN MIENTRAS\nSINO\n    else body\nFIN SI');
  });
});
