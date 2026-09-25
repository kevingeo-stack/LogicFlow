import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ImageRun,
} from 'docx';
import { Diagram, AcademicSettings } from '../types';
import { DiagramRenderer } from './DiagramRenderer';
import html2canvas from 'html2canvas';

export class ExportManager {
  private renderer: DiagramRenderer;

  constructor(renderer: DiagramRenderer) {
    this.renderer = renderer;
  }

  /**
   * Generates formatted submission timestamp string
   */
  private getTimestamp(settings: AcademicSettings): string {
    if (!settings.autoTimestamp) return '';
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return `${dateStr} • ${timeStr} CST`;
  }

  /**
   * PDF Exporter with dynamically injected Academic Header
   */
  public async exportPDF(
    diagram: Diagram,
    settings: AcademicSettings,
    element?: SVGElement | HTMLElement | null
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    // Helper to robustly capture HTML without parent clipping
    const captureHtml = async (el: HTMLElement): Promise<HTMLCanvasElement> => {
      const preEl = el.querySelector('pre');
      const target = preEl || el;
      
      const capWidth = Math.max(target.scrollWidth, target.clientWidth, target.offsetWidth);
      const capHeight = Math.max(target.scrollHeight, target.clientHeight, target.offsetHeight);

      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = `${capWidth}px`;
      clone.style.height = `${capHeight}px`;
      clone.style.overflow = 'visible';
      clone.style.margin = '0';
      clone.style.backgroundColor = '#060e20';

      document.body.appendChild(clone);

      try {
        return await html2canvas(clone, { 
          backgroundColor: '#060e20',
          width: capWidth,
          height: capHeight,
          windowWidth: Math.max(window.innerWidth, capWidth),
          windowHeight: Math.max(window.innerHeight, capHeight),
          scale: 2 
        });
      } finally {
        document.body.removeChild(clone);
      }
    };

    // 1. DYNAMIC ACADEMIC HEADER TILE (Homework Mode)
    const timestamp = this.getTimestamp(settings);

    // Header Background Tile
    doc.setFillColor(15, 23, 42); // #0f172a (obsidian/slate)
    doc.roundedRect(margin, currentY, contentWidth, 75, 4, 4, 'F');

    // Header Border
    doc.setDrawColor(51, 65, 85); // #334155
    doc.setLineWidth(1);
    doc.roundedRect(margin, currentY, contentWidth, 75, 4, 4, 'S');

    // Subject and Timestamp
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 182, 212); // #06b6d4 Cyan
    doc.text((settings.subject || 'CS-302: Algorithms & Complexity').toUpperCase(), margin + 14, currentY + 20);

    if (timestamp) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // #94a3b8
      doc.text(timestamp, margin + contentWidth - 14, currentY + 20, { align: 'right' });
    }

    // Student Full Name
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(248, 250, 252); // #f8fafc
    doc.text(settings.studentName || 'Alex Rivera Santiago', margin + 14, currentY + 40);

    // Student ID / Matrícula & Instructor
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(192, 193, 255); // #c0c1ff Secondary
    const idText = `ID: ${settings.studentId || 'A01783921'}`;
    doc.text(idText, margin + 14, currentY + 56);

    if (settings.professor) {
      doc.setTextColor(148, 163, 184);
      doc.text(`•   Instructor: ${settings.professor}`, margin + 110, currentY + 56);
    }

    // Academic Verified Stamp
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`FLOWGENIUS VERIFIED ACADEMIC NODE • [${(settings.templateStyle || 'IEEE').toUpperCase()} TEMPLATE]`, margin + 14, currentY + 68);

    currentY += 95;

    // 2. DIAGRAM METADATA & TITLE
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(diagram.title, margin, currentY);
    currentY += 18;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `File: ${diagram.filename}  |  Language: ${diagram.language.toUpperCase()}  |  Complexity: ${diagram.complexity}  |  Status: [${diagram.statusBadge}]`,
      margin,
      currentY
    );
    currentY += 15;

    // Divider Line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 15;

    // 3. CANVAS CAPTURE (Flowchart or Pseudocode)
    if (element) {
      try {
        let canvas: HTMLCanvasElement;
        const isSvg = element instanceof SVGElement;
        if (isSvg) {
          canvas = await this.renderer.exportToCanvas(element as SVGElement, diagram.mermaidSyntax);
        } else {
          canvas = await captureHtml(element as HTMLElement);
        }
        const imgData = canvas.toDataURL('image/png');
        
        // Check how much space the code needs
        const codeLinesCount = diagram.sourceCode.split('\n').length;
        const codeRequiredSpace = 14 + (codeLinesCount * 12 + 16) + 20;
        
        const spaceLeft = doc.internal.pageSize.getHeight() - currentY - 40; // 40 is bottom margin

        let diagramAvailableHeight = spaceLeft;
        let codeStartsOnNewPage = false;

        // Dynamic space allocation to avoid shrinking diagram to 0 if code is huge
        if (codeRequiredSpace <= spaceLeft * 0.4) {
          diagramAvailableHeight = spaceLeft - codeRequiredSpace;
        } else {
          diagramAvailableHeight = spaceLeft * 0.6; 
          const remainingForCode = spaceLeft - diagramAvailableHeight;
          if (codeRequiredSpace > remainingForCode) {
            diagramAvailableHeight = spaceLeft; // Give all space to diagram, push code to next page
            codeStartsOnNewPage = true;
          } else {
            diagramAvailableHeight = spaceLeft - codeRequiredSpace;
          }
        }

        const intrinsicWidth = canvas.width;
        const intrinsicHeight = canvas.height;
        const availableWidth = contentWidth;

        const scale = Math.min(
          availableWidth / intrinsicWidth,
          diagramAvailableHeight / intrinsicHeight
        );

        const drawWidth = intrinsicWidth * scale;
        const drawHeight = intrinsicHeight * scale;

        // Center the image horizontally
        const xOffset = margin + (contentWidth - drawWidth) / 2;

        doc.addImage(imgData, 'PNG', xOffset, currentY, drawWidth, drawHeight);
        currentY += drawHeight + 20;

        if (codeStartsOnNewPage) {
          doc.addPage();
          currentY = margin;
        }
      } catch (e) {
        console.warn('[ExportManager] Canvas rasterization skipped in PDF:', e);
      }
    }

    // 4. SOURCE CODE LISTING SECTION
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);

    if (currentY + 40 > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      currentY = margin;
    }

    doc.text('Source Code Implementation:', margin, currentY);
    currentY += 14;

    const codeLines = diagram.sourceCode.split('\n');
    doc.setFont('Courier', 'normal');
    doc.setFontSize(8);

    let lineIndex = 0;
    while (lineIndex < codeLines.length) {
      const availableSpaceForBox = doc.internal.pageSize.getHeight() - currentY - 40;
      const maxLinesThisPage = Math.floor((availableSpaceForBox - 16) / 12);

      if (maxLinesThisPage <= 0) {
        doc.addPage();
        currentY = margin;
        continue;
      }

      const linesToDraw = Math.min(maxLinesThisPage, codeLines.length - lineIndex);
      const boxHeight = linesToDraw * 12 + 16;

      // Code background block
      doc.setFillColor(11, 19, 38); // Dark editor background
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 3, 3, 'F');

      let lineY = currentY + 12;
      for (let i = 0; i < linesToDraw; i++) {
        const lineNum = String(lineIndex + 1).padStart(2, '0');
        doc.setTextColor(100, 116, 139);
        doc.text(lineNum, margin + 8, lineY);
        doc.setTextColor(218, 226, 253);
        doc.text(codeLines[lineIndex].slice(0, 75), margin + 28, lineY);
        lineY += 12;
        lineIndex++;
      }

      currentY += boxHeight + 20;
    }

    // Save PDF
    const suffix = element instanceof SVGElement || !element ? 'diagram' : 'pseudocode';
    const filename = `${diagram.filename.replace(/\.[^/.]+$/, '')}_FlowGenius_${suffix}.pdf`;
    doc.save(filename);
  }

  /**
   * DOCX Word Document Exporter with Academic Header Table
   */
  public async exportDOCX(
    diagram: Diagram,
    settings: AcademicSettings,
    element?: SVGElement | HTMLElement | null
  ): Promise<void> {
    const timestamp = this.getTimestamp(settings);
    const isSvg = element instanceof SVGElement || !element;

    let imageParagraphs: Paragraph[] = [];
    if (element && isSvg) {
      try {
        const canvas = await this.renderer.exportToCanvas(element as SVGElement, diagram.mermaidSyntax);
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const maxWidth = 600;
        const scale = Math.min(1, maxWidth / canvas.width);
        const finalWidth = canvas.width * scale;
        const finalHeight = canvas.height * scale;

        imageParagraphs = [
          new Paragraph({
            text: 'Visual Logic Topology (Exported Diagram)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: bytes,
                transformation: { width: finalWidth, height: finalHeight },
                type: 'png',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        ];
      } catch (e) {
        console.warn('[ExportManager] DOCX Canvas export failed:', e);
      }
    }

    // Build Word document structure
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Academic Header Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 8, color: '06B6D4' },
                        bottom: { style: BorderStyle.SINGLE, size: 8, color: '334155' },
                        left: { style: BorderStyle.SINGLE, size: 8, color: '06B6D4' },
                        right: { style: BorderStyle.SINGLE, size: 8, color: '334155' },
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: (settings.subject || 'CS-302: Algorithms & Complexity').toUpperCase(),
                              bold: true,
                              color: '06B6D4',
                              size: 18,
                            }),
                            new TextRun({
                              text: timestamp ? `   |   ${timestamp}` : '',
                              color: '94A3B8',
                              size: 16,
                            }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: settings.studentName || 'Alex Rivera Santiago',
                              bold: true,
                              size: 24,
                              color: '0F172A',
                            }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `ID (Matrícula): ${settings.studentId || 'A01783921'}`,
                              color: '6366F1',
                              size: 18,
                              bold: true,
                            }),
                            new TextRun({
                              text: settings.professor ? `   •   Instructor: ${settings.professor}` : '',
                              color: '475569',
                              size: 18,
                            }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `VERIFIED FLOWGENIUS DOCUMENT • [${(settings.templateStyle || 'IEEE').toUpperCase()} STYLE]`,
                              size: 14,
                              color: '94A3B8',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // Title & File info
            new Paragraph({
              text: diagram.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Source File: ${diagram.filename}  |  Language: ${diagram.language.toUpperCase()}  |  Complexity: ${diagram.complexity}`, bold: true, color: '475569' }),
              ],
              spacing: { after: 200 },
            }),

            ...imageParagraphs,

            ...(isSvg ? [
              // Flowchart AST Logic Overview
              new Paragraph({
                text: 'Visual Logic Topology (Mermaid Specification)',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: diagram.mermaidSyntax,
                    font: 'Courier New',
                    size: 16,
                    color: '0F172A',
                  }),
                ],
                spacing: { after: 200 },
              }),
            ] : [
              // Pseudocode Logic Overview
              new Paragraph({
                text: 'Generated Pseudocode',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: (element as HTMLElement).innerText || 'No pseudocode generated.',
                    font: 'Courier New',
                    size: 16,
                    color: '0F172A',
                  }),
                ],
                spacing: { after: 200 },
              }),
            ]),

            // Source Code Section
            new Paragraph({
              text: 'Source Code Implementation',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: diagram.sourceCode,
                  font: 'Courier New',
                  size: 16,
                }),
              ],
              spacing: { after: 200 },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const suffix = isSvg ? 'diagram' : 'pseudocode';
    link.download = `${diagram.filename.replace(/\.[^/.]+$/, '')}_FlowGenius_${suffix}.docx`;
    document.body.appendChild(link); // Better browser compatibility
    link.click();
    document.body.removeChild(link);
    
    // Delay revocation to ensure download completes in all browsers
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);
  }

  /**
   * Export as High-Resolution Canvas PNG / JPG with Academic Watermark
   */
  public async exportImage(
    diagram: Diagram,
    settings: AcademicSettings,
    element: SVGElement | HTMLElement,
    format: 'png' | 'jpg' = 'png'
  ): Promise<void> {
    const isSvg = element instanceof SVGElement;
    let rawCanvas: HTMLCanvasElement;
    if (isSvg) {
      rawCanvas = await this.renderer.exportToCanvas(element as SVGElement, diagram.mermaidSyntax);
    } else {
      const el = element as HTMLElement;
      const preEl = el.querySelector('pre');
      const target = preEl || el;
      
      const capWidth = Math.max(target.scrollWidth, target.clientWidth, target.offsetWidth);
      const capHeight = Math.max(target.scrollHeight, target.clientHeight, target.offsetHeight);

      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = `${capWidth}px`;
      clone.style.height = `${capHeight}px`;
      clone.style.overflow = 'visible';
      clone.style.margin = '0';
      clone.style.backgroundColor = '#060e20';

      document.body.appendChild(clone);

      try {
        rawCanvas = await html2canvas(clone, { 
          backgroundColor: '#060e20',
          width: capWidth,
          height: capHeight,
          windowWidth: Math.max(window.innerWidth, capWidth),
          windowHeight: Math.max(window.innerHeight, capHeight),
          scale: 2 
        });
      } finally {
        document.body.removeChild(clone);
      }
    }

    // Create composite canvas with academic banner
    const compositeCanvas = document.createElement('canvas');
    const headerHeight = 120;
    compositeCanvas.width = rawCanvas.width;
    compositeCanvas.height = rawCanvas.height + headerHeight;

    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    // Draw header background
    ctx.fillStyle = '#0b1326';
    ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

    // Academic Header
    ctx.fillStyle = '#171f33';
    ctx.fillRect(20, 16, compositeCanvas.width - 40, headerHeight - 24);

    ctx.fillStyle = '#4cd7f6';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText((settings.subject || 'CS-302: Algorithms & Complexity').toUpperCase(), 40, 46);

    ctx.fillStyle = '#dae2fd';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillText(settings.studentName || 'Alex Rivera Santiago', 40, 80);

    ctx.fillStyle = '#c0c1ff';
    ctx.font = '18px monospace';
    ctx.fillText(`ID: ${settings.studentId || 'A01783921'}  •  Instructor: ${settings.professor || 'None'}`, 40, 104);

    // Draw Diagram
    ctx.drawImage(rawCanvas, 0, headerHeight);

    const dataUrl = compositeCanvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    const suffix = isSvg ? 'diagram' : 'pseudocode';
    link.download = `${diagram.filename.replace(/\.[^/.]+$/, '')}_FlowGenius_${suffix}.${format}`;
    link.click();
  }
}
