import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DiagramCanvasUI } from '../../components/DiagramCanvasUI';
import { AcademicSettings } from '../../types';

describe('DiagramCanvasUI', () => {
  const defaultProps = {
    diagram: {
      id: '1',
      title: 'Test',
      filename: 'test.py',
      sourceCode: 'print("hello")',
      mermaidSyntax: 'graph TD; A-->B;',
      language: 'python' as any,
      nodeCount: 2,
      edgeCount: 1,
      complexity: 'O(1)',
      statusBadge: 'OK',
      category: 'script',
      pipelineNodes: [],
      createdAt: '',
      updatedAt: '',
      nodes: [{ type: 'io', label: 'hello', details: 'print' } as any]
    },
    settings: {
      appLanguage: 'en',
      diagramLanguage: 'es',
    } as AcademicSettings,
    appLanguage: 'en' as any,
    diagramLanguage: 'es' as any,
    isGenerating: false,
    diagramViewMode: 'flowchart' as 'flowchart' | 'pseudocode',
    setDiagramViewMode: vi.fn(),
    onExport: vi.fn(),
    t: (key: string) => key,
    renderer: {
      renderMermaid: vi.fn().mockResolvedValue('<svg></svg>')
    } as any,
    svgContainerRef: { current: null },
    pseudocodeContainerRef: { current: null },
  };

  it('renders flowchart initially', () => {
    render(<DiagramCanvasUI {...(defaultProps as any)} />);
    expect(screen.getByText('Flowchart')).toBeTruthy();
    expect(screen.getByText('Pseudocode')).toBeTruthy();
  });

  it('calls setDiagramViewMode when pseudocode tab is clicked', () => {
    const setViewModeMock = vi.fn();
    render(<DiagramCanvasUI {...(defaultProps as any)} setDiagramViewMode={setViewModeMock} />);
    
    const pseudoTab = screen.getByText('Pseudocode');
    fireEvent.click(pseudoTab);
    
    expect(setViewModeMock).toHaveBeenCalledWith('pseudocode');
  });

  it('renders PseudocodeUI when diagramViewMode is pseudocode', () => {
    render(<DiagramCanvasUI {...(defaultProps as any)} diagramViewMode="pseudocode" />);
    
    // Test that the PseudocodeUI component renders generated pseudocode containing our label
    expect(screen.getByText(/hello/i)).toBeTruthy();
  });

  it('PseudocodeUI pre tag allows horizontal scroll without clipping via min-w-max', () => {
    render(<DiagramCanvasUI {...(defaultProps as any)} diagramViewMode="pseudocode" />);
    
    // The pre tag should have 'min-w-max' to ensure long lines don't get clipped by padding
    const preElement = screen.getByText(/hello/i).closest('pre');
    expect(preElement).not.toBeNull();
    expect(preElement?.className).toContain('min-w-max');
  });
});
