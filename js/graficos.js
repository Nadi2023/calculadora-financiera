/* =========================================================
   GRÁFICOS — Integrante 7
   1) Diagrama de Flujo de Efectivo (canvas nativo)
   2) Cuadro de Saldo de Efectivo (Chart.js)
   Lee los datos de "resultadoCalculo" (definido en script.js).
   ========================================================= */

let balanceChart = null;

function _fmtMon(v, s){
  return s + Number(v || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ---------- 1. Diagrama de Flujo de Efectivo ---------- */
function dibujarDiagramaFlujo(resultado){
  const canvas = document.getElementById('cashFlowChart');
  if(!canvas || !resultado) return;

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth || 520;
  const cssH = canvas.parentElement.clientHeight || 300;
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.height = cssH + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const cs = getComputedStyle(document.documentElement);
  const C = {
    ink:     cs.getPropertyValue('--ink').trim()      || '#1c2b39',
    inkSoft: cs.getPropertyValue('--ink-soft').trim() || '#5c6b74',
    rule:    cs.getPropertyValue('--rule').trim()     || '#c9bfa4',
    credit:  cs.getPropertyValue('--credit').trim()   || '#3f6b52',
    debit:   cs.getPropertyValue('--debit').trim()    || '#8a3324'
  };

  const { monto, cuotaMensual, plazoMeses, simbolo } = resultado;

  const padL = 46, padR = 46, padT = 46, padB = 42;
  const w = cssW - padL - padR;
  const midY = padT + (cssH - padT - padB) / 2;
  const maxUp   = midY - padT;
  const maxDown = cssH - padB - midY;

  const montoSafe = monto || 1;
  const cuotaSafe = cuotaMensual || 1;
  const scale = Math.min(maxUp / montoSafe, maxDown / cuotaSafe) * 0.9;

  // Leyenda
  ctx.font = '600 10.5px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.credit;
  ctx.textAlign = 'left';
  ctx.fillText('↑ Monto recibido', padL, 16);
  ctx.fillStyle = C.debit;
  ctx.textAlign = 'right';
  ctx.fillText('↓ Cuotas mensuales', padL + w, 16);

  // Línea base
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL - 10, midY);
  ctx.lineTo(padL + w + 10, midY);
  ctx.stroke();

  // Marcas de tiempo
  const stepX = w / plazoMeses;
  const tickEvery = Math.max(1, Math.ceil(plazoMeses / 8));
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = C.inkSoft;
  for(let i = 0; i <= plazoMeses; i += tickEvery){
    const x = padL + stepX * i;
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, midY - 3);
    ctx.lineTo(x, midY + 3);
    ctx.stroke();
    ctx.fillText('t=' + i, x, midY + 7);
  }

  // Flecha de desembolso (t = 0)
  const x0 = padL;
  const upTop = midY - montoSafe * scale;
  ctx.strokeStyle = C.credit;
  ctx.fillStyle = C.credit;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x0, midY);
  ctx.lineTo(x0, upTop + 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0, upTop);
  ctx.lineTo(x0 - 6, upTop + 11);
  ctx.lineTo(x0 + 6, upTop + 11);
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 11px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(_fmtMon(monto, simbolo), x0 + 10, upTop + 16);

  // Flechas de pago
  const drawHeads = plazoMeses <= 36;
  ctx.strokeStyle = C.debit;
  ctx.fillStyle = C.debit;
  for(let i = 1; i <= plazoMeses; i++){
    const x = padL + stepX * i;
    const yDown = midY + cuotaSafe * scale;
    ctx.lineWidth = drawHeads ? 1.8 : 1;
    ctx.beginPath();
    ctx.moveTo(x, midY);
    ctx.lineTo(x, yDown - (drawHeads ? 9 : 0));
    ctx.stroke();
    if(drawHeads){
      ctx.beginPath();
      ctx.moveTo(x, yDown);
      ctx.lineTo(x - 5, yDown - 10);
      ctx.lineTo(x + 5, yDown - 10);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Etiqueta de la cuota
  ctx.font = 'bold 10.5px "IBM Plex Mono", monospace';
  ctx.fillStyle = C.debit;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Cuota: ' + _fmtMon(cuotaMensual, simbolo),
               padL + w, cssH - 6);
}

/* ---------- 2. Cuadro de Saldo de Efectivo ---------- */
function dibujarGraficoSaldo(resultado){
  const canvas = document.getElementById('balanceChart');
  if(!canvas || !resultado || typeof Chart === 'undefined') return;

  const { monto, tabla, simbolo } = resultado;

  const labels = ['0'];
  const saldoData = [monto];
  const interesAcumData = [0];
  let acumulado = 0;

  tabla.forEach(fila => {
    labels.push(String(fila.mes));
    saldoData.push(Number(fila.saldo.toFixed(2)));
    acumulado += fila.interes;
    interesAcumData.push(Number(acumulado.toFixed(2)));
  });

  const cs = getComputedStyle(document.documentElement);
  const ink     = cs.getPropertyValue('--ink').trim()      || '#1c2b39';
  const inkSoft = cs.getPropertyValue('--ink-soft').trim() || '#5c6b74';
  const debit   = cs.getPropertyValue('--debit').trim()    || '#8a3324';

  if(balanceChart){ balanceChart.destroy(); balanceChart = null; }

  balanceChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Saldo pendiente',
          data: saldoData,
          borderColor: ink,
          backgroundColor: 'rgba(28,43,57,0.10)',
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'Interés acumulado',
          data: interesAcumData,
          borderColor: debit,
          backgroundColor: 'rgba(138,51,36,0.05)',
          fill: false,
          tension: 0.25,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [5, 4]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: ink, boxWidth: 14, boxHeight: 3,
            font: { family: 'IBM Plex Mono', size: 11 }
          }
        },
        tooltip: {
          backgroundColor: ink,
          titleFont: { family: 'IBM Plex Mono', size: 11 },
          bodyFont:  { family: 'IBM Plex Mono', size: 11 },
          callbacks: {
            title: items => 'Mes ' + items[0].label,
            label: c => c.dataset.label + ': ' + _fmtMon(c.parsed.y, simbolo)
          }
        }
      },
      scales: {
        x: {
          title: { display:true, text:'Mes', color: inkSoft,
                   font:{ family:'IBM Plex Mono', size:10 } },
          ticks: { color: inkSoft, maxTicksLimit: 12,
                   font:{ family:'IBM Plex Mono', size:10 } },
          grid: { color: 'rgba(201,191,164,0.35)' }
        },
        y: {
          title: { display:true, text:'Monto', color: inkSoft,
                   font:{ family:'IBM Plex Mono', size:10 } },
          ticks: {
            color: inkSoft,
            font:{ family:'IBM Plex Mono', size:10 },
            callback: v => simbolo + Number(v).toLocaleString('es-ES')
          },
          grid: { color: 'rgba(201,191,164,0.35)' }
        }
      }
    }
  });
}

/* ---------- Punto de entrada único ---------- */
function actualizarVisualizaciones(resultado){
  if(!resultado) return;
  dibujarDiagramaFlujo(resultado);
  dibujarGraficoSaldo(resultado);
}

/* Redibuja el diagrama al cambiar el tamaño de la ventana */
let _redrawTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_redrawTimer);
  _redrawTimer = setTimeout(() => {
    if(typeof resultadoCalculo !== 'undefined' && resultadoCalculo){
      dibujarDiagramaFlujo(resultadoCalculo);
      if(balanceChart) balanceChart.resize();
    }
  }, 150);
});