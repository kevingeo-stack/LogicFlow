import { ASTNode, DiagramLanguage } from '../types';
import { td } from '../i18n/i18n';

export function generatePseudocode(nodes: ASTNode[], language: DiagramLanguage): string {
  const lines: string[] = [];
  let indentLevel = 0;

  const pushLine = (text: string) => {
    lines.push('    '.repeat(Math.max(0, indentLevel)) + text);
  };

  const declaredVariables = new Map<string, string>(); 
  let hasDeclarations = false;
  nodes.forEach(node => {
     if (node.variableName && node.variableType) {
        declaredVariables.set(node.variableName, node.variableType);
     }
  });

  let changed = true;
  while (changed) {
    changed = false;
    nodes.forEach(node => {
      if (node.type === 'process' && node.variableName && !declaredVariables.has(node.variableName)) {
        if (node.expression) {
          let inferredType: string | undefined = undefined;
          let hasFloat = false;
          let hasInt = false;
          let hasString = false;
          let hasBool = false;

          declaredVariables.forEach((type, varName) => {
            const regex = new RegExp(`\\b${varName}\\b`);
            if (regex.test(node.expression!)) {
              if (type === 'float') hasFloat = true;
              if (type === 'int') hasInt = true;
              if (type === 'str') hasString = true;
              if (type === 'bool') hasBool = true;
            }
          });

          if (hasFloat || node.expression.includes('/')) inferredType = 'float';
          else if (hasInt) inferredType = 'int';
          else if (hasString) inferredType = 'str';
          else if (hasBool) inferredType = 'bool';

          if (!inferredType) {
            if (node.expression.match(/^[0-9]+$/)) inferredType = 'int';
            else if (node.expression.match(/^[0-9]*\.[0-9]+$/)) inferredType = 'float';
            else if (node.expression.match(/^["'].*["']$/)) inferredType = 'str';
            else if (node.expression.match(/^(True|False|true|false)$/)) inferredType = 'bool';
          }

          if (inferredType) {
            declaredVariables.set(node.variableName, inferredType);
            changed = true;
          }
        }
      }
    });
  }

  let algName = 'Main';
  const startNode = nodes.find(n => n.type === 'start');
  if (startNode && startNode.label) {
     const match = startNode.label.match(/^([a-zA-Z0-9_]+)/);
     if (match) algName = match[1];
  }

  pushLine(`${td('diagram.algorithm', language)} ${algName}`);
  pushLine('');

  if (declaredVariables.size > 0) {
      const byType = new Map<string, string[]>();
      declaredVariables.forEach((type, vName) => {
         const t = byType.get(type) || [];
         t.push(vName);
         byType.set(type, t);
      });

      byType.forEach((vars, type) => {
         const typeLabel = td(`diagram.type.${type}` as any, language) || type;
         pushLine(`${td('diagram.define', language)} ${vars.join(', ')} ${td('diagram.as', language)} ${typeLabel}`);
         hasDeclarations = true;
      });
  }

  if (hasDeclarations) pushLine('');

  nodes.forEach(node => {
    switch (node.type) {
      case 'start':
        break;

      case 'end':
        if (node.id === 'End_Complete' || node.label === '') {
          pushLine('');
          pushLine(`${td('diagram.endAlgorithm', language)}`);
        } else {
          pushLine('');
          pushLine(`${td('diagram.endAlgorithm', language)} ${node.label}`);
        }
        break;

      case 'decision':
        if (node.details === 'elif') {
          indentLevel--;
          pushLine(`${td('diagram.elseIf', language)} ${node.expression || node.label.replace('?', '').trim()} ${td('diagram.then', language)}`);
          indentLevel++;
        } else {
          pushLine(`${td('diagram.if', language)} ${node.expression || node.label.replace('?', '').trim()} ${td('diagram.then', language)}`);
          indentLevel++;
        }
        break;

      case 'loop':
        const keyword = node.details === 'for' ? td('diagram.for', language) : td('diagram.while', language);
        pushLine(`${keyword} ${node.expression || node.label.replace('?', '').trim()} ${td('diagram.do', language)}`);
        indentLevel++;
        break;

      case 'block_end':
        if (node.details === 'else') {
          indentLevel--;
          pushLine(td('diagram.else', language));
          indentLevel++;
        } else if (node.details === 'if') {
          indentLevel--;
          pushLine(td('diagram.endIf', language));
        } else if (node.details === 'while') {
          indentLevel--;
          pushLine(td('diagram.endWhile', language));
        } else if (node.details === 'for') {
          indentLevel--;
          pushLine(td('diagram.endFor', language));
        }
        break;

      case 'io':
        if (node.ioType === 'input' && node.variableName) {
           if (node.message) {
               pushLine(`${td('diagram.write', language)} ${node.message}`);
           }
           pushLine(`${td('diagram.read', language)} ${node.variableName}`);
        } else if (node.ioType === 'output' && node.message) {
           pushLine(`${td('diagram.write', language)} ${node.message}`);
        } else {
           pushLine(node.label);
        }
        break;

      case 'process':
        if (node.label.startsWith('return ') || node.label === 'return') {
          const val = node.label.replace(/^return\s*/, '').trim();
          pushLine(`${td('diagram.return', language)}${val ? ' ' + val : ''}`);
        } else if (node.variableName && node.expression) {
           pushLine(`${node.variableName} ← ${node.expression}`);
        } else {
           pushLine(node.expression || node.label);
        }
        break;

      case 'call':
        if (node.label.startsWith('return ') || node.label === 'return') {
          const val = node.label.replace(/^return\s*/, '').trim();
          pushLine(`${td('diagram.return', language)}${val ? ' ' + val : ''}`);
        } else {
          pushLine(node.expression || node.label);
        }
        break;
    }
  });

  return lines.join('\n');
}

