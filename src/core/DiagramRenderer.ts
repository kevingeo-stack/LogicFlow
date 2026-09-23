import mermaid from 'mermaid';

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  isGridVisible: boolean;
}

export class DiagramRenderer {
  private isInitialized: boolean = false;
  private renderCounter: number = 0;

  // Cache for rapid sequential exports
  private lastCapturedCanvas: HTMLCanvasElement | null = null;
  private lastCapturedSyntax: string | null = null;

  constructor() {
    this.initMermaid();
  }

  private initMermaid() {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: 'transparent',
          mainBkg: '#171f33',
          nodeBorder: '#38bdf8',
          textColor: '#dae2fd',
          lineColor: '#4cd7f6',
          secondaryColor: '#3131c0',
          tertiaryColor: '#23b2ec',
          fontFamily: 'JetBrains Mono, Inter, monospace',
          fontSize: '12px',
        },
        flowchart: {
          curve: 'basis',
          htmlLabels: true,
          padding: 14,
          nodeSpacing: 40,
          rankSpacing: 40,
        },
        securityLevel: 'loose',
      });
      this.isInitialized = true;
    } catch (err) {
      console.warn('[DiagramRenderer] Mermaid initialization notice:', err);
    }
  }

  /**
   * Renders the given Mermaid syntax into SVG markup 100% offline.
   */
  public async renderMermaid(syntax: string, containerId: string = 'flowchart-svg-container'): Promise<string> {
    if (!this.isInitialized) {
      this.initMermaid();
    }

    try {
      const uniqueId = `mermaid_render_${++this.renderCounter}_${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, syntax);
      return svg;
    } catch (error: any) {
      console.warn('[DiagramRenderer] Error rendering Mermaid syntax:', error);
      // Fallback clean SVG representation if syntax fails
      return `<div class="p-4 text-center text-error bg-error-container/20 rounded-lg">
        <span class="material-symbols-outlined text-[24px]">error</span>
        <p class="font-code-snippet text-xs mt-1">Syntax parsing error. Refreshing logic topology...</p>
      </div>`;
    }
  }

  /**
   * Converts SVG element or its container to Canvas using html2canvas 
   * to perfectly preserve foreignObject and visual HTML elements.
   */
  public async exportToCanvas(svgElement: SVGElement, mermaidSyntax?: string): Promise<HTMLCanvasElement> {
    if (mermaidSyntax && this.lastCapturedSyntax === mermaidSyntax && this.lastCapturedCanvas) {
      return this.lastCapturedCanvas;
    }

    // Dynamic import for html2canvas to avoid SSR/Node issues if ever used in testing environments
    const html2canvas = (await import('html2canvas')).default;

    const container = svgElement.parentElement;
    if (!container) {
      throw new Error('SVG Element must have a parent container to capture properly.');
    }

    // Save original styles to restore in finally block
    const originalTransform = container.style.transform;
    const originalWidth = container.style.width;
    const originalHeight = container.style.height;
    const originalPosition = container.style.position;
    const originalOverflow = container.style.overflow;

    try {
      // 1. Get intrinsic SVG bounds so we capture the FULL diagram, not just the cropped viewport
      const bbox = (svgElement as SVGSVGElement).getBBox();
      const intrinsicWidth = Math.max(bbox.width + bbox.x + 40, 800);
      const intrinsicHeight = Math.max(bbox.height + bbox.y + 40, 600);

      // 2. Temporarily reset transformations and force container size to match full SVG
      container.style.transform = 'none';
      container.style.width = `${intrinsicWidth}px`;
      container.style.height = `${intrinsicHeight}px`;
      // Ensure the container is positioned relatively so it doesn't break page flow but allows full capture
      container.style.position = 'absolute';
      container.style.overflow = 'visible';

      // 3. Render canvas
      const canvas = await html2canvas(container, {
        backgroundColor: '#060e20',
        scale: 2, // High-DPI 2x for sharp edges
        logging: false,
        useCORS: true,
        allowTaint: true,
        // Wait a bit to ensure fonts/foreignObjects are ready
        onclone: (clonedDoc) => {
          const clonedContainer = clonedDoc.getElementById(container.id) || clonedDoc.querySelector('svg')?.parentElement;
          if (clonedContainer) {
            // Re-apply blueprint background to the clone explicitly
            clonedContainer.style.backgroundImage = 'radial-gradient(#1e2e4d 1.5px, transparent 1.5px)';
            clonedContainer.style.backgroundSize = '20px 20px';
          }
        }
      });

      if (mermaidSyntax) {
        this.lastCapturedCanvas = canvas;
        this.lastCapturedSyntax = mermaidSyntax;
      }

      return canvas;
    } finally {
      // 4. Restore exact original state guaranteed!
      container.style.transform = originalTransform;
      container.style.width = originalWidth;
      container.style.height = originalHeight;
      container.style.position = originalPosition;
      container.style.overflow = originalOverflow;
    }
  }
}
