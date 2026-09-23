import React, { useEffect, useState, useRef } from 'react';
import { DiagramRenderer } from '../core/DiagramRenderer';

import { Diagram, AppLanguage, DiagramLanguage } from '../types';
import { t } from '../i18n/i18n';
import { PseudocodeUI } from './PseudocodeUI';
import { generatePseudocode } from '../core/PseudocodeGenerator';

export type DiagramViewMode = 'flowchart' | 'pseudocode';

interface DiagramCanvasUIProps {
  diagram: Diagram;
  renderer: DiagramRenderer;
  svgContainerRef: React.RefObject<HTMLDivElement | null>;
  pseudocodeContainerRef: React.RefObject<HTMLDivElement | null>;
  diagramViewMode: DiagramViewMode;
  setDiagramViewMode: (mode: DiagramViewMode) => void;
  appLanguage: AppLanguage;
  diagramLanguage: DiagramLanguage;
}

export const DiagramCanvasUI: React.FC<DiagramCanvasUIProps> = ({
  diagram,
  renderer,
  svgContainerRef,
  pseudocodeContainerRef,
  diagramViewMode,
  setDiagramViewMode,
  appLanguage,
  diagramLanguage,
}) => {
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isGrid, setIsGrid] = useState<boolean>(true);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom, pan });

  useEffect(() => {
    stateRef.current = { zoom, pan };
  }, [zoom, pan]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      // Allow normal scroll if cursor is outside the actual SVG
      const svgEl = svgContainerRef.current?.querySelector('svg');
      if (!svgEl || !svgEl.contains(e.target as Node)) {
        return;
      }

      e.preventDefault();

      const { zoom: currentZoom, pan: currentPan } = stateRef.current;
      
      const zoomSensitivity = 0.0015;
      let newZoom = currentZoom - (e.deltaY * zoomSensitivity);
      newZoom = Math.min(Math.max(newZoom, 0.4), 2.5);
      
      if (newZoom === currentZoom) return;

      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const CX = rect.width / 2;
      const CY = rect.height / 2;

      const newPanX = mouseX - CX - ((mouseX - CX - currentPan.x) / currentZoom) * newZoom;
      const newPanY = mouseY - CY - ((mouseY - CY - currentPan.y) / currentZoom) * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
      stateRef.current = { zoom: newZoom, pan: { x: newPanX, y: newPanY } };
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [diagramViewMode]);

  useEffect(() => {
    let isMounted = true;
    renderer.renderMermaid(diagram.mermaidSyntax).then((svg) => {
      if (isMounted) {
        setSvgMarkup(svg);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [diagram.mermaidSyntax, renderer]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <section className="flex flex-col bg-[#060e20] rounded-xl shadow-lg border border-[#334155]/60 overflow-hidden relative" id="panelCanvas">
      {/* Canvas Header & Metrics */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#131b2e] border-b border-[#334155]/50 z-10 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">schema</span>
            <span className="font-semibold text-xs sm:text-sm text-[#dae2fd]">Visual Logic Topology</span>
          </div>

          <div className="flex items-center bg-[#060e20] p-0.5 rounded border border-[#334155]/60" role="tablist">
            <button
              role="tab"
              aria-selected={diagramViewMode === 'flowchart'}
              onClick={() => setDiagramViewMode('flowchart')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                diagramViewMode === 'flowchart' ? 'bg-[#222a3d] text-[#4cd7f6]' : 'text-[#869397] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">account_tree</span>
              {t('editor.flowchart', appLanguage)}
            </button>
            <button
              role="tab"
              aria-selected={diagramViewMode === 'pseudocode'}
              onClick={() => setDiagramViewMode('pseudocode')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                diagramViewMode === 'pseudocode' ? 'bg-[#222a3d] text-[#4cd7f6]' : 'text-[#869397] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">code</span>
              {t('editor.pseudocode', appLanguage)}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#4cd7f6] font-['JetBrains_Mono',monospace] text-[11px] font-medium">
            {diagram.nodeCount} Nodes
          </span>
          <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#7bd0ff] font-['JetBrains_Mono',monospace] text-[11px] font-medium">
            {diagram.edgeCount} Edges
          </span>
        </div>
      </div>

      {diagramViewMode === 'flowchart' ? (
        /* Viewport with blueprint dot-grid */
        <div
          ref={viewportRef}
          className={`relative w-full overflow-hidden bg-[#060e20] min-h-[440px] sm:min-h-[500px] flex items-center justify-center p-4 select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={
            isGrid
              ? {
                  backgroundImage: 'radial-gradient(#1e2e4d 1.5px, transparent 1.5px)',
                  backgroundSize: '20px 20px',
                }
              : {}
          }
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Rendered SVG with Pan & Zoom transform */}
          <div
            ref={svgContainerRef}
            className="origin-center flex items-center justify-center w-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />

          {/* Academic Watermark Stamp Overlay */}
          <div className="absolute bottom-3 right-3 z-20 pointer-events-none opacity-85 flex items-center gap-1.5 bg-[#060e20]/80 backdrop-blur border border-[#334155]/40 px-2.5 py-1 rounded shadow">
            <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">school</span>
            <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[#869397] tracking-wider">
              FlowGenius Academic · Matrícula Verified
            </span>
          </div>

          {/* Floating Canvas Toolbar */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-[#222a3d]/90 backdrop-blur border border-[#334155]/60 px-2 py-1 rounded-lg shadow-xl">
            <button
              onClick={handleZoomIn}
              className="w-7 h-7 flex items-center justify-center rounded text-[#dae2fd] hover:text-[#4cd7f6] hover:bg-[#171f33] transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="w-7 h-7 flex items-center justify-center rounded text-[#dae2fd] hover:text-[#4cd7f6] hover:bg-[#171f33] transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1.5 h-7 flex items-center justify-center rounded font-['JetBrains_Mono',monospace] text-[11px] text-[#bcc9cd] hover:text-[#4cd7f6] hover:bg-[#171f33] transition-colors"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <div className="w-px h-4 bg-[#334155] mx-0.5"></div>
            <button
              onClick={() => setPan({ x: 0, y: 0 })}
              className="w-7 h-7 flex items-center justify-center rounded text-[#dae2fd] hover:text-[#4cd7f6] hover:bg-[#171f33] transition-colors"
              title="Center Viewport"
              aria-label="Center Viewport"
            >
              <span className="material-symbols-outlined text-[16px]">filter_center_focus</span>
            </button>
            <button
              onClick={() => setIsGrid((prev) => !prev)}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                isGrid ? 'text-[#4cd7f6] bg-[#171f33]' : 'text-[#869397] hover:text-[#dae2fd]'
              }`}
              title="Toggle Blueprint Grid"
              aria-label="Toggle Blueprint Grid"
            >
              <span className="material-symbols-outlined text-[16px]">grid_4x4</span>
            </button>
          </div>
        </div>
      ) : (
        <PseudocodeUI
          pseudocode={generatePseudocode(diagram.nodes || [], diagramLanguage)}
          containerRef={pseudocodeContainerRef}
        />
      )}
    </section>
  );
};
