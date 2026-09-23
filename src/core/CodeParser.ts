import { ParseResult, ASTNode, ASTEdge, DiagramLanguage } from '../types';
import { td } from '../i18n/i18n';

interface ExitPath {
  id: string;
  label?: string;
}

interface BlockState {
  type: 'if' | 'else' | 'while' | 'for';
  decisionNodeId: string;
  indent: number;
  isBraceBlock: boolean;
  pendingExits: ExitPath[];
}

export class CodeParser {
  public parse(code: string, language: string = 'python', diagramLang: DiagramLanguage = 'en'): ParseResult {
    const startTime = performance.now();
    const rawLines = code.split('\n');

    const nodes: ASTNode[] = [];
    const edges: ASTEdge[] = [];

    let functionName = 'main';

    const parsedLines = rawLines.map(l => {
      const text = l.trim();
      const indent = l.search(/\S|$/);
      const isClosingBrace = text.startsWith('}');
      return { text, indent, isClosingBrace };
    }).filter(l => l.text.length > 0 && !l.text.startsWith('#') && !l.text.startsWith('//'));

    if (parsedLines.length === 0) {
      return {
        mermaidSyntax: `flowchart TD\n  Start(["${td('diagram.start', diagramLang)}"]):::startEnd\n  End(["${td('diagram.end', diagramLang)}"]):::startEnd\n  Start --> End`,
        nodes: [{ id: 'Start', type: 'start', label: '' }, { id: 'End', type: 'end', label: '' }],
        edges: [{ from: 'Start', to: 'End' }],
        nodeCount: 2, edgeCount: 1, complexity: 'O(1)',
        parseTimeMs: Math.round(performance.now() - startTime),
      };
    }

    let nodeIndex = 1;
    let blockStack: BlockState[] = [];
    let currentExits: ExitPath[] = [];
    const functionExits: ExitPath[] = [];

    const firstLine = parsedLines[0].text;
    const funcMatch = firstLine.match(/(?:def|function|void|int|public\s+static\s+void)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
    if (funcMatch) {
      functionName = funcMatch[1];
      const params = funcMatch[2];
      nodes.push({ id: 'Start', type: 'start', label: `${functionName}(${params ? params.slice(0, 20) : ''})` });
    } else {
      nodes.push({ id: 'Start', type: 'start', label: `${functionName}()` });
    }
    currentExits = [{ id: 'Start' }];

    // 2. Body traversal
    for (let i = (funcMatch ? 1 : 0); i < parsedLines.length; i++) {
      const line = parsedLines[i];
      const text = line.text;

      // Check block closures (dedent or })
      while (blockStack.length > 0) {
        const top = blockStack[blockStack.length - 1];
        let isClosed = false;

        if (top.isBraceBlock && line.isClosingBrace) {
          isClosed = true;
        } else if (!top.isBraceBlock && line.indent <= top.indent) {
          if (top.type === 'if' && line.indent === top.indent && (text.startsWith('else') || text.startsWith('elif'))) {
            isClosed = false; // Continuation
          } else {
            isClosed = true;
          }
        }

        if (isClosed) {
          const closedBlock = blockStack.pop()!;
          nodes.push({ id: `EndBlock_${nodeIndex++}`, type: 'block_end', label: '', details: closedBlock.type === 'else' ? 'if' : closedBlock.type });
          if (closedBlock.type === 'if') {
            // No else followed. True branch exits + False branch exit.
            closedBlock.pendingExits.push(...currentExits);
            closedBlock.pendingExits.push({ id: closedBlock.decisionNodeId, label: 'false' });
            currentExits = [...closedBlock.pendingExits];
          } else if (closedBlock.type === 'else') {
            closedBlock.pendingExits.push(...currentExits);
            currentExits = [...closedBlock.pendingExits];
          } else if (closedBlock.type === 'while' || closedBlock.type === 'for') {
            // Back-edge to condition
            for (const exit of currentExits) {
              edges.push({ from: exit.id, to: closedBlock.decisionNodeId, label: exit.label });
            }
            currentExits = [{ id: closedBlock.decisionNodeId, label: 'false' }];
          }
        } else {
          break;
        }
      }

      if (line.isClosingBrace && text === '}') continue;

      // Handle IF
      if (text.startsWith('if ') || text.startsWith('if(')) {
        const condId = `Cond_${nodeIndex++}`;
        const cleanCond = text.replace(/^if\s*\(?/, '').replace(/\)?:?\s*\{?$/, '').trim();
        nodes.push({ id: condId, type: 'decision', label: `${cleanCond.slice(0, 32)} ?` });

        for (const exit of currentExits) {
          edges.push({ from: exit.id, to: condId, label: exit.label });
        }

        blockStack.push({
          type: 'if',
          decisionNodeId: condId,
          indent: line.indent,
          isBraceBlock: text.endsWith('{'),
          pendingExits: []
        });

        currentExits = [{ id: condId, label: 'true' }];
        continue;
      }

      // Handle ELSE IF / ELSE
      if (text.startsWith('elif ') || text.startsWith('else if') || text.startsWith('else:') || text.startsWith('else') || text.startsWith('else {')) {
        const topBlock = blockStack[blockStack.length - 1];
        if (topBlock && topBlock.type === 'if') {
          topBlock.pendingExits.push(...currentExits);
          
          if (text.startsWith('else:') || text.startsWith('else') || text.startsWith('else {')) {
             topBlock.type = 'else';
             nodes.push({ id: `ElseBlock_${nodeIndex++}`, type: 'block_end', label: '', details: 'else' });
             currentExits = [{ id: topBlock.decisionNodeId, label: 'false' }];
          } else {
             // elif is essentially another decision on the 'No' branch of the previous 'if'
             const elifId = `Elif_${nodeIndex++}`;
             const cond = text.replace(/^(?:elif|else\s+if)\s*\(?/, '').replace(/\)?:?\s*\{?$/, '').trim();
             nodes.push({ id: elifId, type: 'decision', label: `${cond.slice(0, 32)} ?`, details: 'elif' });
             
             edges.push({ from: topBlock.decisionNodeId, to: elifId, label: 'false' });
             
             // The top block now monitors the 'elif' decision!
             topBlock.decisionNodeId = elifId;
             currentExits = [{ id: elifId, label: 'true' }];
          }
        }
        continue;
      }

      // Handle WHILE / FOR
      if (text.startsWith('while ') || text.startsWith('while(') || text.startsWith('for ') || text.startsWith('for(')) {
        const loopId = `Loop_${nodeIndex++}`;
        const cleanCond = text.replace(/^(?:while|for)\s*\(?/, '').replace(/\)?:?\s*\{?$/, '').trim();
        const typeStr = text.startsWith('for') ? 'for' : 'while';
        nodes.push({ id: loopId, type: 'loop', label: cleanCond.slice(0, 32), details: typeStr });

        for (const exit of currentExits) {
          edges.push({ from: exit.id, to: loopId, label: exit.label });
        }

        blockStack.push({
          type: text.startsWith('for') ? 'for' : 'while',
          decisionNodeId: loopId,
          indent: line.indent,
          isBraceBlock: text.endsWith('{'),
          pendingExits: []
        });

        currentExits = [{ id: loopId, label: 'true' }];
        continue;
      }

      // Handle RETURN
      if (text.startsWith('return ') || text.startsWith('return;') || text.startsWith('return')) {
        const val = text.replace(/^return\s*/, '').replace(/;$/, '').trim();
        const retId = `Return_${nodeIndex++}`;
        nodes.push({ id: retId, type: 'process', label: `return ${val || 'void'}` });
        
        for (const exit of currentExits) {
          edges.push({ from: exit.id, to: retId, label: exit.label });
        }
        functionExits.push({ id: retId });
        currentExits = []; // terminal!
        continue;
      }

      // Process (or IO)
      const procId = `Proc_${nodeIndex++}`;
      const isIo = text.includes('print(') || text.includes('console.log(') || text.includes('input(') || text.includes('scanf(');
      
      nodes.push({ id: procId, type: isIo ? 'io' : (text.includes('(') ? 'call' : 'process'), label: text.replace(/;$/, '').replace(/"/g, "'").slice(0, 40) });

      for (const exit of currentExits) {
        edges.push({ from: exit.id, to: procId, label: exit.label });
      }
      currentExits = [{ id: procId }];
    }

    // Close all remaining blocks
    while (blockStack.length > 0) {
      const closedBlock = blockStack.pop()!;
      nodes.push({ id: `EndBlock_${nodeIndex++}`, type: 'block_end', label: '', details: closedBlock.type === 'else' ? 'if' : closedBlock.type });
      if (closedBlock.type === 'if') {
        closedBlock.pendingExits.push(...currentExits);
        closedBlock.pendingExits.push({ id: closedBlock.decisionNodeId, label: 'false' });
        currentExits = [...closedBlock.pendingExits];
      } else if (closedBlock.type === 'else') {
        closedBlock.pendingExits.push(...currentExits);
        currentExits = [...closedBlock.pendingExits];
      } else if (closedBlock.type === 'while' || closedBlock.type === 'for') {
        for (const exit of currentExits) {
          edges.push({ from: exit.id, to: closedBlock.decisionNodeId, label: exit.label });
        }
        currentExits = [{ id: closedBlock.decisionNodeId, label: 'false' }];
      }
    }

    // Connect all remaining exits to END
    const allFinalExits = [...currentExits, ...functionExits];
    if (allFinalExits.length > 0) {
      const endId = 'End_Complete';
      nodes.push({ id: endId, type: 'end', label: '' });
      for (const exit of allFinalExits) {
        edges.push({ from: exit.id, to: endId, label: exit.label });
      }
    }

    const mermaidSyntax = this.buildMermaidMarkup(nodes, edges, diagramLang);
    
    // Estimate complexity (heuristic based on loops)
    const loopCount = nodes.filter(n => n.type === 'loop').length;
    let complexity = 'O(1)';
    if (loopCount === 1) complexity = 'O(n)';
    else if (loopCount >= 2) complexity = 'O(n²)';

    const visualNodes = nodes.filter(n => n.type !== 'block_end');

    return {
      mermaidSyntax, nodes, edges,
      nodeCount: visualNodes.length, edgeCount: edges.length,
      complexity, parseTimeMs: Math.max(8, Math.round(performance.now() - startTime)),
    };
  }

  private buildMermaidMarkup(nodes: ASTNode[], edges: ASTEdge[], diagramLang: DiagramLanguage): string {
    const lines: string[] = ['flowchart TD'];

    lines.push('  classDef startEnd fill:#06b6d4,stroke:#38bdf8,stroke-width:2px,color:#060e20,font-weight:bold;');
    lines.push('  classDef decision fill:#171f33,stroke:#38bdf8,stroke-width:2px,color:#7bd0ff;');
    lines.push('  classDef process fill:#222a3d,stroke:#334155,stroke-width:1px,color:#dae2fd;');
    lines.push('  classDef io fill:#0f3f3f,stroke:#14b8a6,stroke-width:1px,color:#ccfbf1;');

    nodes.forEach((n) => {
      if (n.type === 'block_end') return;
      let text = n.label.replace(/"/g, "'").replace(/[\[\]\(\)\{\}]/g, '');
      
      if (n.type === 'start') {
        text = td('diagram.start', diagramLang) + (text ? `: ${text}` : '');
        lines.push(`  ${n.id}(["${text}"]):::startEnd`);
      } else if (n.type === 'end') {
        text = td('diagram.end', diagramLang);
        lines.push(`  ${n.id}(["${text}"]):::startEnd`);
      } else if (n.type === 'loop') {
        const loopStr = td(n.details === 'for' ? 'diagram.for' : 'diagram.while', diagramLang);
        text = `${loopStr}: ${text}`;
        lines.push(`  ${n.id}{"${text}"}:::decision`);
      } else if (n.type === 'decision') {
        lines.push(`  ${n.id}{"${text}"}:::decision`);
      } else if (n.type === 'io') {
        lines.push(`  ${n.id}[/"${text}"/]:::io`);
      } else {
        lines.push(`  ${n.id}["${text}"]:::process`);
      }
    });

    edges.forEach((e) => {
      let edgeLabel = e.label;
      if (e.label === 'true') edgeLabel = td('diagram.true', diagramLang);
      if (e.label === 'false') edgeLabel = td('diagram.false', diagramLang);
      
      if (edgeLabel) lines.push(`  ${e.from} -- ${edgeLabel} --> ${e.to}`);
      else lines.push(`  ${e.from} --> ${e.to}`);
    });

    return lines.join('\n');
  }
}
