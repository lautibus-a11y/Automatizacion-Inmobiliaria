import type { Inspection } from '../types';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

function conditionLabel(c: string) {
  const map: Record<string, string> = {
    excelente: 'Excelente', muy_bueno: 'Muy bueno', bueno: 'Bueno', regular: 'Regular', malo: 'Malo'
  };
  return map[c] || c;
}

function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToBuffer(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function getImageInfo(dataUrl: string): { rawData: string; format: string } {
  if (dataUrl.startsWith('data:image/png;base64,')) {
    return { rawData: dataUrl, format: 'PNG' };
  }
  if (dataUrl.startsWith('data:image/webp;base64,')) {
    return { rawData: dataUrl, format: 'PNG' }; // jsPDF no soporta WEBP, convertimos a PNG
  }
  return { rawData: dataUrl, format: 'JPEG' };
}

function imageTypeFromName(name: string): 'jpg' | 'png' {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  return 'jpg';
}

// pastel celeste sky palette
const SKY_HEADER = [186, 230, 253] as const;   // sky-200
const SKY_LIGHT = [224, 242, 254] as const;    // sky-100
const SKY_ACCENT = [14, 165, 233] as const;    // sky-500
const SKY_MUTED = [148, 163, 184] as const;
const SKY_DARK = [12, 74, 110] as const;       // sky-900
const WHITE = [255, 255, 255] as const;

export async function exportPDF(inspection: Inspection) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210;
  const ml = 16;
  const mr = 16;
  const cw = pw - ml - mr;
  let y = ml;

  // ── Compact header bar ──
  doc.setFillColor(...SKY_HEADER);
  doc.rect(0, 0, pw, 38, 'F');
  doc.setFillColor(...SKY_ACCENT);
  doc.rect(0, 38, pw, 1.5, 'F');

  doc.setTextColor(...SKY_DARK);
  doc.setFontSize(16);
  doc.text('Informe de Inspección', ml, 16);
  doc.setFontSize(8);
  doc.setTextColor(...SKY_MUTED);
  doc.text(inspection.address, ml, 24);
  doc.text(`${inspection.client} — ${inspection.propertyType} — ${new Date(inspection.createdAt).toLocaleDateString('es-AR')}`, ml, 31);

  if (!inspection.results) { doc.save(`informe-${inspection.id.slice(0, 8)}.pdf`); return; }
  const r = inspection.results;

  y = 50;

  // ═══ RESUMEN GENERAL ═══
  doc.setFillColor(...SKY_LIGHT);
  doc.roundedRect(ml, y, cw, 6 + (r.generalState.propertySummary ? 8 : 0), 2, 2, 'F');
  doc.setTextColor(...SKY_ACCENT);
  doc.setFontSize(9);
  doc.text('RESUMEN GENERAL', ml + 4, y + 4.5);
  if (r.generalState.propertySummary) {
    doc.setFontSize(7);
    doc.setTextColor(...SKY_DARK);
    const sumL = doc.splitTextToSize(r.generalState.propertySummary, cw - 8);
    doc.text(sumL, ml + 4, y + 12);
    y += sumL.length * 3.5 + 14;
  } else {
    y += 12;
  }

  // ═══ SCORE + INFO ROW ═══
  if (y > 280) { doc.addPage(); y = ml; }

  // Score circle
  doc.setFillColor(...SKY_ACCENT);
  doc.circle(ml + 14, y + 14, 14, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.text(`${r.generalState.conservationScore}`, ml + 8, y + 18);
  doc.setFontSize(5);
  doc.text('/100', ml + 18, y + 18);

  // Info beside score
  const maintLabel = r.generalState.maintenanceLevel === 'bajo' ? 'Mantenimiento bajo' :
    r.generalState.maintenanceLevel === 'medio' ? 'Mantenimiento medio' : 'Mantenimiento alto';
  doc.setTextColor(...SKY_DARK);
  doc.setFontSize(9);
  doc.text(maintLabel, ml + 38, y + 8);
  doc.setFontSize(7);
  doc.setTextColor(...SKY_MUTED);
  const concL = doc.splitTextToSize(r.generalState.conclusion, cw - 48);
  doc.text(concL, ml + 38, y + 16);

  y += 34;

  // ═══ PUNTAJES POR AMBIENTE ═══
  if (r.environmentSummaries.length > 0) {
    if (y > 270) { doc.addPage(); y = ml; }
    const cols = 4;
    const gap = 4;
    const cardW = (cw - (cols - 1) * gap) / cols;
    r.environmentSummaries.forEach((env, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = ml + col * (cardW + gap);
      const cy = y + row * 16;
      if (cy + 14 > 285) return;
      doc.setFillColor(...SKY_LIGHT);
      doc.roundedRect(cx, cy, cardW, 14, 1, 1, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...SKY_MUTED);
      doc.text(env.environment.replace('_', ' '), cx + 2, cy + 5);
      doc.setFontSize(10);
      doc.setTextColor(...SKY_ACCENT);
      doc.text(`${env.score}`, cx + 2, cy + 13);
    });
    const envRows = Math.ceil(r.environmentSummaries.length / cols);
    y += envRows * 16 + 4;
  }

  // ═══ ANÁLISIS POR FOTOGRAFÍA ═══
  if (y > 260) { doc.addPage(); y = ml; }
  doc.setFillColor(...SKY_LIGHT);
  doc.roundedRect(ml, y, cw, 12, 2, 2, 'F');
  doc.setTextColor(...SKY_DARK);
  doc.setFontSize(9);
  doc.text('Análisis por Fotografía', ml + 4, y + 8);
  y += 16;

  for (let i = 0; i < inspection.images.length; i++) {
    const img = inspection.images[i];
    const analysis = r.imageAnalyses[i];
    if (!analysis) continue;

    if (y > 265) { doc.addPage(); y = ml; }

    // Image label
    doc.setFillColor(...SKY_HEADER);
    doc.roundedRect(ml, y, cw, 10, 1.5, 1.5, 'F');
    doc.setTextColor(...SKY_DARK);
    doc.setFontSize(8);
    doc.text(`Imagen ${i + 1}`, ml + 4, y + 7);
    y += 12;

    // Image + description side by side (compact)
    try {
      const imgData = await imageToBase64(img.file);
      const { rawData, format } = getImageInfo(imgData);
      const iw = 56, ih = 42;
      doc.addImage(rawData, format, ml, y, iw, ih);

      doc.setFontSize(7);
      doc.setTextColor(...SKY_DARK);
      const descX = ml + iw + 5;
      const descW = cw - iw - 5;
      const descLines = doc.splitTextToSize(analysis.description, descW);
      doc.text(descLines, descX, y + 4);
      y += ih + 6;
    } catch {
      y += 4;
    }

    // Problems compact
    if (analysis.problems.length > 0) {
      if (y > 278) { doc.addPage(); y = ml; }
      doc.setFontSize(6.5);
      doc.setTextColor(180, 83, 9);
      analysis.problems.forEach(p => {
        if (y > 282) { doc.addPage(); y = ml; }
        doc.text(`▸ ${p.description}`, ml + 3, y);
        y += 3.5;
      });
      y += 3;
    }
  }

  // ═══ CONCLUSIÓN ═══
  if (y > 250) { doc.addPage(); y = ml; }
  doc.setDrawColor(...SKY_ACCENT);
  doc.setLineWidth(0.4);
  doc.line(ml, y, pw - mr, y);
  y += 8;

  doc.setFillColor(...SKY_HEADER);
  doc.roundedRect(ml, y, cw, 12, 2, 2, 'F');
  doc.setTextColor(...SKY_DARK);
  doc.setFontSize(9);
  doc.text('Conclusión General', ml + 4, y + 8);
  y += 16;

  doc.setFontSize(8);
  doc.setTextColor(...SKY_DARK);
  const cl = doc.splitTextToSize(r.generalState.conclusion, cw);
  doc.text(cl, ml, y);

  doc.save(`informe-${inspection.id.slice(0, 8)}.pdf`);
}

export async function exportDOCX(inspection: Inspection) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, ImageRun } = await import('docx');
  const r = inspection.results;

  const children: any[] = [
    new Paragraph({ text: 'Informe de Inspección', heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `Dirección: ${inspection.address}`, spacing: { after: 100 } }),
    new Paragraph({ text: `Cliente: ${inspection.client}` }),
    new Paragraph({ text: `Tipo: ${inspection.propertyType}` }),
    new Paragraph({ text: `Fecha: ${new Date(inspection.createdAt).toLocaleDateString('es-AR')}`, spacing: { after: 200 } }),
  ];

  if (r) {
    children.push(new Paragraph({ text: 'Estado General', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: `Puntaje de conservación: ${r.generalState.conservationScore}/100` }));
    children.push(new Paragraph({ text: `Nivel de mantenimiento: ${r.generalState.maintenanceLevel === 'bajo' ? 'Bajo' : r.generalState.maintenanceLevel === 'medio' ? 'Medio' : 'Alto'}` }));
    children.push(new Paragraph({ text: r.generalState.conclusion, spacing: { after: 200 } }));

    children.push(new Paragraph({ text: 'Inventario Técnico', heading: HeadingLevel.HEADING_1 }));
    const invRows = [
      new TableRow({
        tableHeader: true,
        children: ['Elemento', 'Cantidad', 'Categoría', 'Marca'].map(h =>
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })
        ),
      }),
      ...r.inventory.map(item =>
        new TableRow({
          children: [item.name, String(item.count), item.category, item.brand || '-'].map(cell =>
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell })] })] })
          ),
        })
      ),
    ];
    children.push(new Table({ rows: invRows }));
    children.push(new Paragraph({ spacing: { after: 200 } }));

    children.push(new Paragraph({ text: 'Análisis por Fotografía', heading: HeadingLevel.HEADING_1 }));

    for (let i = 0; i < inspection.images.length; i++) {
      const img = inspection.images[i];
      const analysis = r.imageAnalyses[i];
      if (!analysis) continue;

      children.push(new Paragraph({ text: `Imagen ${i + 1}`, heading: HeadingLevel.HEADING_2 }));

      try {
        const imgBuffer = await fileToBuffer(img.file);
        const imgType = imageTypeFromName(img.file.name);
        children.push(new Paragraph({
          children: [new ImageRun({ data: imgBuffer, transformation: { width: 400, height: 300 }, type: imgType })],
        }));
      } catch (e) {
        console.warn('DOCX: no se pudo insertar imagen', i + 1, e);
        children.push(new Paragraph({ children: [new TextRun({ text: `[Imagen ${i + 1} no disponible]`, italics: true })] }));
      }

      children.push(new Paragraph({ text: 'Descripción', heading: HeadingLevel.HEADING_3 }));
      children.push(new Paragraph({ text: analysis.description, spacing: { after: 100 } }));

      if (analysis.objects.length > 0) {
        children.push(new Paragraph({ text: 'Objetos detectados', heading: HeadingLevel.HEADING_3 }));
        const objRows = [
          new TableRow({
            tableHeader: true,
            children: ['Elemento', 'Cant.', 'Marca', 'Estado'].map(h =>
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })
            ),
          }),
          ...analysis.objects.map(obj =>
            new TableRow({
              children: [
                obj.name,
                String(obj.count),
                obj.brand || '-',
                conditionLabel(obj.condition),
              ].map(cell =>
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell })] })] })
              ),
            })
          ),
        ];
        children.push(new Table({ rows: objRows }));
      }

      if (analysis.problems.length > 0) {
        children.push(new Paragraph({ text: 'Observaciones', heading: HeadingLevel.HEADING_3 }));
        analysis.problems.forEach(p => {
          children.push(new Paragraph({ text: `- ${p.description}`, bullet: { level: 0 } }));
        });
      }

      children.push(new Paragraph({ spacing: { after: 200 } }));
    }

    if (r.generalState.propertySummary) {
      children.push(new Paragraph({ text: 'Resumen de la Propiedad', heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: r.generalState.propertySummary, spacing: { after: 200 } }));
    }

    children.push(new Paragraph({ text: 'Conclusión General', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: r.generalState.conclusion }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `informe-${inspection.id.slice(0, 8)}.docx`);
}
