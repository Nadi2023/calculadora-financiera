/* =========================================================
   GRÁFICOS Y TABLA — Integrante 6
   1) Gráfico pastel: Capital vs Intereses (Chart.js)
   2) Tabla de amortización mes a mes
   Lee los datos de "resultadoCalculo" (definido en script.js).
   ========================================================= */

let graficoPastel = null;

/* ---------- 1. Gráfico pastel Capital vs Intereses ---------- */
function dibujarGraficoPastel(resultado){
  const canvas = document.getElementById('graficoPrestamo');
  if(!canvas || !resultado || typeof Chart === 'undefined') return;

  const { monto, totalIntereses, simbolo } = resultado;

  // Destruye la instancia previa para poder redibujar sin duplicar
  if(graficoPastel){ graficoPastel.destroy(); graficoPastel = null; }

  const cs = getComputedStyle(document.documentElement);
  const ink       = cs.getPropertyValue('--ink').trim()        || '#1c2b39';
  const paperSoft = cs.getPropertyValue('--paper-soft').trim() || '#f6f0e2';
  const debit     = cs.getPropertyValue('--debit').trim()      || '#8a3324';
  const highlight = cs.getPropertyValue('--highlight').trim()  || '#c98a2b';

  graficoPastel = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Capital', 'Intereses'],
      datasets: [{
        data: [monto, totalIntereses],
        backgroundColor: [ink, debit],
        borderColor: paperSoft,
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: ink,
            font: { family: 'IBM Plex Mono', size: 12 },
            padding: 14
          }
        },
        tooltip: {
          backgroundColor: ink,
          titleFont: { family: 'IBM Plex Mono', size: 11 },
          bodyFont:  { family: 'IBM Plex Mono', size: 11 },
          callbacks: {
            label: c => {
              const total = c.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((c.parsed / total) * 100).toFixed(1) : '0.0';
              const val = simbolo + Number(c.parsed).toLocaleString('es-ES', {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              });
              return c.label + ': ' + val + ' (' + pct + '%)';
            }
          }
        }
      }
    }
  });
}

/* ---------- 2. Tabla de amortización ---------- */
function renderizarTablaAmortizacion(resultado){
  const tbody = document.querySelector('#tablaAmortizacion tbody');
  if(!tbody || !resultado) return;

  const { tabla, simbolo } = resultado;
  const fmt = v => simbolo + Number(v).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const frag = document.createDocumentFragment();

  tabla.forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + fila.mes + '</td>' +
      '<td>' + fmt(fila.cuota)   + '</td>' +
      '<td>' + fmt(fila.capital) + '</td>' +
      '<td>' + fmt(fila.interes) + '</td>' +
      '<td>' + fmt(fila.saldo)   + '</td>';
    frag.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(frag);
}

/* ---------- 3. Punto de entrada único del Integrante 6 ---------- */
function actualizarVisualizacionesI6(resultado){
  if(!resultado) return;
  dibujarGraficoPastel(resultado);
  renderizarTablaAmortizacion(resultado);
}

/*Nota: Se usa doughnut (anillo) en lugar de pastel relleno porque se ve más elegante 
y encaja con el estilo papel/tinta" del proyecto. Si prefieres pastel clásico, 
cambia type: 'doughnut' por type: 'pie' y elimina la línea cutout: '55%'.*/