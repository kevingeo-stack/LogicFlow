import { describe, it, expect } from 'vitest';
import { generatePseudocode } from '../../core/PseudocodeGenerator';
import { ASTNode } from '../../types';
import { CodeParser } from '../../core/CodeParser';

describe('PseudocodeGenerator', () => {
  it('Test 1 - Secuencia simple', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'process', label: 'A' },
      { id: '2', type: 'process', label: 'B' }
    ];
    const result = generatePseudocode(nodes, 'en');
    expect(result).toBe('Algorithm Main\n\nA\nB');
  });

  it('Test 2 - IF', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'decision', label: 'x?' },
      { id: '2', type: 'process', label: 'A' },
      { id: '3', type: 'block_end', label: '', details: 'if' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('Algoritmo Main\n\nSI x ENTONCES\n    A\nFIN SI');
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
    expect(result).toBe('Algoritmo Main\n\nSI x ENTONCES\n    A\nSINO\n    B\nFIN SI');
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
    expect(result).toBe('Algorithm Main\n\nIF x THEN\n    IF y THEN\n        A\n    END IF\n    B\nEND IF');
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
    expect(result).toBe('Algoritmo Main\n\nSI x ENTONCES\n    A\n    SI y ENTONCES\n        B\n    SINO\n        C\n    FIN SI\n    D\nFIN SI\nE');
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
    expect(result).toBe('Algoritmo Main\n\nSI x ENTONCES\n    A\nSINO SI y ENTONCES\n    B\nFIN SI');
  });

  it('Test 7 - WHILE', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'loop', label: 'x > 0', details: 'while' },
      { id: '2', type: 'process', label: 'x = x - 1' },
      { id: '3', type: 'block_end', label: '', details: 'while' }
    ];
    const result = generatePseudocode(nodes, 'en');
    expect(result).toBe('Algorithm Main\n\nWHILE x > 0 DO\n    x = x - 1\nEND WHILE');
  });

  it('Test 8 - FOR', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'loop', label: 'i in array', details: 'for' },
      { id: '2', type: 'process', label: 'print i' },
      { id: '3', type: 'block_end', label: '', details: 'for' }
    ];
    const result = generatePseudocode(nodes, 'es');
    expect(result).toBe('Algoritmo Main\n\nPARA i in array HACER\n    print i\nFIN PARA');
  });

  it('Test 9 - RETURN', () => {
    const nodes: ASTNode[] = [
      { id: '1', type: 'process', label: 'return x' }
    ];
    const resultEn = generatePseudocode(nodes, 'en');
    const resultEs = generatePseudocode(nodes, 'es');
    expect(resultEn).toBe('Algorithm Main\n\nRETURN x');
    expect(resultEs).toBe('Algoritmo Main\n\nRETORNAR x');
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
    expect(result).toBe('Algoritmo main\n\nSI a == b ENTONCES\n    print a\nFIN SI\n\nFinAlgoritmo');
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
    expect(result).toBe('Algorithm main\n\nIF a == b THEN\n    print a\nEND IF\n\nEnd Algorithm');
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
    expect(result).toBe('Algoritmo Main\n\nSI a ENTONCES\n    MIENTRAS b HACER\n        SI c ENTONCES\n            do it\n        FIN SI\n    FIN MIENTRAS\nSINO\n    else body\nFIN SI');
  });

  describe('Fase 8.5 - F-Strings y Declaraciones', () => {
    const parser = new CodeParser();

    it('Test 1 - F-string simple', () => {
      const code = `print(f"Hola {nombre}")`;
      const result = parser.parse(code, 'python', 'es');
      const pseudo = generatePseudocode(result.nodes, 'es');
      expect(pseudo).toContain('Escribir "Hola ", nombre');
      expect(pseudo).not.toContain('f"');
      expect(result.mermaidSyntax).toContain('[/"SALIDA &quot;Hola &quot;, nombre"/]:::io');
    });

    it('Test 2 - F-string con formato', () => {
      const code = `print(f"Promedio: {promedio:.2f}")`;
      const result = parser.parse(code, 'python', 'es');
      const pseudo = generatePseudocode(result.nodes, 'es');
      expect(pseudo).toContain('Escribir "Promedio: ", promedio');
      expect(pseudo).not.toContain(':.2f');
      expect(result.mermaidSyntax).toContain('[/"SALIDA &quot;Promedio: &quot;, promedio"/]:::io');
    });

    it('Test 3 - F-string con \\n', () => {
      const code = `print(f"\\nEl promedio final es: {promedio:.2f}")`;
      const result = parser.parse(code, 'python', 'es');
      const pseudo = generatePseudocode(result.nodes, 'es');
      expect(pseudo).toContain('Escribir "El promedio final es: ", promedio');
      expect(pseudo).not.toContain('\\n');
    });

    it('Test 4 - Declaracion de promedio', () => {
      const code = `
calificacion1 = float(input("a"))
calificacion2 = float(input("b"))
calificacion3 = float(input("c"))
promedio = (calificacion1 + calificacion2 + calificacion3) / 3
      `.trim();
      const result = parser.parse(code, 'python', 'es');
      const pseudo = generatePseudocode(result.nodes, 'es');
      expect(pseudo).toContain('Definir calificacion1, calificacion2, calificacion3, promedio Como Real');
    });

    it('Test 5 - Variable adicional (Inferencia)', () => {
      const code = `
a = 10
b = 20
resultado = a + b
      `.trim();
      const result = parser.parse(code, 'python', 'es');
      const pseudo = generatePseudocode(result.nodes, 'es');
      expect(pseudo).toContain('Definir a, b, resultado Como Entero');
    });

    it('Test 6 - No duplicar variables', () => {
      const code = `
a = 10
a = 20
      `.trim();
      const result = parser.parse(code, 'python', 'es');
      const pseudo = generatePseudocode(result.nodes, 'es');
      const defineCount = (pseudo.match(/Definir/g) || []).length;
      expect(defineCount).toBe(1);
      expect(pseudo).toContain('Definir a Como Entero');
    });
    it('Test 7 - Regresion del ejercicio completo', () => {
      const code = `
calificacion1 = float(input("Ingrese la primera calificación: "))
calificacion2 = float(input("Ingrese la segunda calificación: "))
calificacion3 = float(input("Ingrese la tercera calificación: "))
promedio = (calificacion1 + calificacion2 + calificacion3) / 3
if promedio >= 70:
    print("Aprobado: ¡Felicidades! (nota >= 70)")
else:
    print("Reprobado: Debes esforzarte más (nota < 70)")
print(f"\\nEl promedio final es: {promedio:.2f}")
      `.trim();
      const result = parser.parse(code, 'python', 'es');
      const pseudo = generatePseudocode(result.nodes, 'es');
      
      expect(pseudo).toContain('Definir calificacion1, calificacion2, calificacion3, promedio Como Real');
      expect(pseudo).toContain('Leer calificacion1');
      expect(pseudo).toContain('Escribir "Ingrese la primera calificación: "');
      expect(pseudo).toContain('promedio ← (calificacion1 + calificacion2 + calificacion3) / 3');
      expect(pseudo).toContain('SI promedio >= 70 ENTONCES');
      expect(pseudo).toContain('Escribir "Aprobado: ¡Felicidades! (nota >= 70)"');
      expect(pseudo).toContain('SINO');
      expect(pseudo).toContain('Escribir "El promedio final es: ", promedio');

      expect(pseudo).not.toContain('f"');
      expect(pseudo).not.toContain(':.2f');
      expect(pseudo).not.toContain('\\n');
    });
  });
});

