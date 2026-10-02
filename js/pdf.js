/* =========================================================
   EXPORTACIÓN A PDF — Integrante 7
   Comprobante con: resumen, Cash Flow, Cash Balance,
   espacio para análisis de resultados y pie de página.
   Requiere jsPDF (CDN).
   ========================================================= */

function exportarPDF(){
  if(typeof resultadoCalculo === 'undefined' || !resultadoCalculo){
    alert('Realiza primero un cálculo para poder exportar.');
    return;
  }
  if(!window.jspdf || !window.jspdf.jsPDF){
    alert('No se pudo cargar jsPDF. Revisa tu conexión.');
    return;
  }

  const btn = document.getElementById('btnPDF');
  const original = btn ? btn.innerHTML : '';
  if(btn){ btn.disabled = true; btn.innerHTML = 'Generando PDF...'; }

  try{
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'pt', format:'a4' });

    const r = resultadoCalculo;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 42;
    const contentW = pageW - margin * 2;

    const INK       = [28, 43, 57];
    const INK_SOFT  = [92, 107, 116];
    const HIGHLIGHT = [201, 138, 43];
    const RULE      = [201, 191, 164];
    const PAPER     = [246, 240, 226];

    const fmt = v => r.simbolo + Number(v).toLocaleString('es-ES', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });

    let y = 0;

    /* ---------- Encabezado ---------- */
    doc.setFillColor(...INK);
    doc.rect(0, 0, pageW, 78, 'F');
    doc.setFillColor(...HIGHLIGHT);
    doc.rect(0, 78, pageW, 3, 'F');

    doc.setTextColor(...PAPER);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Comprobante de Préstamo', margin, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(201, 191, 164);
    doc.text('Calculadora Financiera — Resumen y Análisis', margin, 58);

    y = 112;

    /* ---------- Helper de títulos ---------- */
    const sectionTitle = (title) => {
      if(y + 60 > pageH - margin){ doc.addPage(); y = margin; }
      doc.setTextColor(...INK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(title, margin, y);
      y += 6;
      doc.setDrawColor(...HIGHLIGHT);
      doc.setLineWidth(2);
      doc.line(margin, y, margin + 50, y);
      y += 18;
    };

    /* ---------- 1. Datos del préstamo ---------- */
    sectionTitle('Datos del préstamo');

    const filas = [
      ['Monto del préstamo',    fmt(r.monto)],
      ['Tasa de interés anual', r.tasaAnual + ' %'],
      ['Plazo',                 r.plazoMeses + ' meses'],
      ['Cuota mensual',         fmt(r.cuotaMensual)],
      ['Total de intereses',    fmt(r.totalIntereses)],
      ['Total a pagar',         fmt(r.totalPagar)]
    ];

    doc.setFontSize(10.5);
    filas.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...INK_SOFT);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...INK);
      doc.text(value, pageW - margin, y, { align: 'right' });
      y += 17;
    });

    y += 16;

    /* ---------- Helper para insertar un canvas ---------- */
    const insertCanvas = (id, title) => {
      if(y + 240 > pageH - margin){ doc.addPage(); y = margin; }
      sectionTitle(title);
      const cv = document.getElementById(id);
      if(cv && cv.width > 0){
        const img = cv.toDataURL('image/png');
        const ratio = cv.height / cv.width;
        const h = contentW * ratio;
        doc.addImage(img, 'PNG', margin, y, contentW, h);
        y += h + 22;
      }
    };

    /* ---------- 2. Gráfico pastel: Capital vs Intereses ---------- */
    insertCanvas('graficoPrestamo', 'Distribución del Préstamo (Capital vs Intereses)');

    /* ---------- 3. Cash Flow Diagram ---------- */
    insertCanvas('cashFlowChart', 'Diagrama de Flujo de Efectivo');

    /* ---------- 4. Cash Balance Chart ---------- */
    insertCanvas('balanceChart', 'Cuadro de Saldo de Efectivo');

    /* ---------- 5. Tabla de Amortización ---------- */
    if(y + 120 > pageH - margin){ doc.addPage(); y = margin; }
    sectionTitle('Tabla de Amortización');

    const colRight = [
      margin + contentW * 0.20,
      margin + contentW * 0.40,
      margin + contentW * 0.60,
      margin + contentW * 0.80,
      margin + contentW
    ];
    const headers = ['Mes', 'Cuota', 'Capital', 'Intereses', 'Saldo'];

    const drawHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      headers.forEach((h, i) => {
        doc.text(h, colRight[i], y, { align: i === 0 ? 'left' : 'right' });
      });
      y += 5;
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.7);
      doc.line(margin, y, pageW - margin, y);
      y += 13;
    };

    drawHeader();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const rowH = 13;

    r.tabla.forEach(fila => {
      if(y > pageH - margin - rowH){
        doc.addPage();
        y = margin;
        drawHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }
      const celdas = [
        String(fila.mes),
        fmt(fila.cuota),
        fmt(fila.capital),
        fmt(fila.interes),
        fmt(fila.saldo)
      ];
      doc.setTextColor(...INK);
      celdas.forEach((v, i) => {
        doc.text(v, colRight[i], y, { align: i === 0 ? 'left' : 'right' });
      });
      y += rowH;
    });

    y += 22;

    /* ---------- 6. Análisis de Resultados ---------- */
    if(y + 200 > pageH - margin){ doc.addPage(); y = margin; }
    sectionTitle('Análisis de Resultados');

    const proporcion = r.monto > 0
      ? ((r.totalIntereses / r.monto) * 100).toFixed(1) : '0.0';

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...INK_SOFT);
    const nota = 'El total de intereses representa ' + proporcion +
                 '% del monto solicitado. La cuota mensual es de ' +
                 fmt(r.cuotaMensual) + ' durante ' + r.plazoMeses +
                 ' meses.';
    const notaLineas = doc.splitTextToSize(nota, contentW);
    doc.text(notaLineas, margin, y);
    y += notaLineas.length * 14 + 14;

    // Renglones en blanco para escribir el análisis
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.5);
    const gap = 24;
    while(y < pageH - margin - gap){
      doc.line(margin, y, pageW - margin, y);
      y += gap;
    }

    /* ---------- 7. Pie de página ---------- */
    const totalPages = doc.getNumberOfPages();
    for(let p = 1; p <= totalPages; p++){
      doc.setPage(p);
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.5);
      doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...INK_SOFT);
      doc.text('Calculadora Financiera — Proyecto grupal', margin, pageH - 18);
      doc.text('Página ' + p + ' / ' + totalPages,
               pageW - margin, pageH - 18, { align: 'right' });
    }

    doc.save('comprobante-prestamo.pdf');

  }catch(err){
    console.error(err);
    alert('Ocurrió un error al generar el PDF: ' + err.message);
  }finally{
    if(btn){ btn.disabled = false; btn.innerHTML = original; }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnPDF');
  if(btn) btn.addEventListener('click', exportarPDF);
});