import { ASTNode, DiagramLanguage } from '../types';
import { td } from '../i18n/i18n';

export function generatePseudocode(nodes: ASTNode[], language: DiagramLanguage): string {
  const lines: string[] = [];
  let indentLevel = 0;

  const pushLine = (text: string) => {
    lines.push('    '.repeat(Math.max(0, indentLevel)) + text);
  };

  nodes.forEach(node => {
    switch (node.type) {
      case 'start':
        pushLine(`${td('diagram.start', language)} ${node.label}`);
        break;

      case 'end':
        if (node.id === 'End_Complete' || node.label === '') {
          pushLine(`${td('diagram.end', language)}`);
        } else {
          pushLine(`${td('diagram.end', language)} ${node.label}`);
        }
        break;

      case 'decision':
        if (node.details === 'elif') {
          indentLevel--;
          pushLine(`${td('diagram.elseIf', language)} ${node.label.replace('?', '').trim()} ${td('diagram.then', language)}`);
          indentLevel++;
        } else {
          pushLine(`${td('diagram.if', language)} ${node.label.replace('?', '').trim()} ${td('diagram.then', language)}`);
          indentLevel++;
        }
        break;

      case 'loop':
        const keyword = node.details === 'for' ? td('diagram.for', language) : td('diagram.while', language);
        pushLine(`${keyword} ${node.label.replace('?', '').trim()} ${td('diagram.do', language)}`);
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

      case 'process':
      case 'call':
      case 'io':
        if (node.label.startsWith('return ') || node.label === 'return') {
          const val = node.label.replace(/^return\s*/, '').trim();
          pushLine(`${td('diagram.return', language)}${val ? ' ' + val : ''}`);
        } else {
          pushLine(node.label);
        }
        break;
    }
  });

  return lines.join('\n');
}
