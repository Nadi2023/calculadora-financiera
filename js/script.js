/* ============================================================
   LÓGICA PRINCIPAL – sincronización de inputs y cálculo
   ============================================================ */

const montoTexto     = document.getElementById('montoTexto');
const montoSlider    = document.getElementById('montoSlider');
const tasaTexto      = document.getElementById('tasaTexto');
const tasaSlider     = document.getElementById('tasaSlider');
const plazoTexto     = document.getElementById('plazoTexto');
const plazoSlider    = document.getElementById('plazoSlider');
const segmentoMoneda = document.getElementById('segmentoMoneda');
const simboloMonto   = document.getElementById('simboloMonto');
let monedaActual     = '$';
const btnCalcular    = document.getElementById('btnCalcular');
const cuotaMensualEl = document.getElementById('cuotaMensual');
const totalPagarEl   = document.getElementById('totalPagar');
const totalInteresesEl = document.getElementById('totalIntereses');
const receiptResult  = document.getElementById('receiptResult');
const receiptLoader  = document.getElementById('receiptLoader');

// Variable global para almacenar la instancia del gráfico (Integrante 6)
let graficoInstancia = null;

// Actualiza la variable CSS --fill del slider según su valor actual,
// para que la barra se vea rellena desde el inicio hasta el cursor.
function actualizarRelleno(slider) {
  if (!slider) return;
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const porcentaje = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', `${porcentaje}%`);
}

// Sincroniza slider e input de texto bidireccionalmente
function sincronizarInput(slider, input) {
  if (!slider || !input) return;
  slider.addEventListener('input', () => {
    input.value = slider.value;
    actualizarRelleno(slider);
  });
  input.addEventListener('input', () => {
    let val = parseFloat(input.value) || 0;
    slider.value = val;
    actualizarRelleno(slider);
  });
  actualizarRelleno(slider);
}

// Inicializar la sincronización de los tres campos de entrada
sincronizarInput(montoSlider, montoTexto);
sincronizarInput(tasaSlider, tasaTexto);
sincronizarInput(plazoSlider, plazoTexto);

// Cambio de moneda activa
if (segmentoMoneda) {
  const botonesMoneda = segmentoMoneda.querySelectorAll('button');
  botonesMoneda.forEach(btn => {
    btn.addEventListener('click', () => {
      botonesMoneda.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      monedaActual = btn.getAttribute('data-simbolo') || '$';
      if (simboloMonto) simboloMonto.textContent = monedaActual;
    });
  });
}

// Evento del botón para realizar los cálculos y mostrar la animación de loader
if (btnCalcular) {
  btnCalcular.addEventListener('click', () => {
    if (receiptResult && receiptLoader) {
      receiptResult.style.display = 'none';
      receiptLoader.style.display = 'block';
    }

    setTimeout(() => {
      calcularPrestamo();
      if (receiptResult && receiptLoader) {
        receiptLoader.style.display = 'none';
        receiptResult.style.display = 'block';
      }
      const bloqueReservado = document.getElementById('bloqueReservado');
      if (bloqueReservado) bloqueReservado.style.display = 'block';
    }, 500);
  });
}

// Función principal para realizar los cálculos financieros del préstamo
function calcularPrestamo() {
  const monto = parseFloat(montoTexto.value) || 0;
  const tasaAnual = parseFloat(tasaTexto.value) || 0;
  const plazoMeses = parseInt(plazoTexto.value) || 0;

  const tasaMensual = (tasaAnual / 100) / 12;

  let cuotaMensual = 0;
  if (tasaMensual === 0) {
    cuotaMensual = monto / plazoMeses;
  } else {
    cuotaMensual = monto * (tasaMensual / (1 - Math.pow(1 + tasaMensual, -plazoMeses)));
  }

  // Generación de la tabla de amortización e intereses totales
  const totalIntereses = generarTablaAmortizacion(monto, tasaMensual, plazoMeses, cuotaMensual);
  const totalPagar = monto + totalIntereses;

  // Actualizar el panel del recibo
  if (cuotaMensualEl) cuotaMensualEl.textContent = `${monedaActual}${cuotaMensual.toFixed(2)}`;
  if (totalInteresesEl) totalInteresesEl.textContent = `${monedaActual}${totalIntereses.toFixed(2)}`;
  if (totalPagarEl) totalPagarEl.textContent = `${monedaActual}${totalPagar.toFixed(2)}`;

  // ============================================================
  // Actualización de la Gráfica Dinámica
  // ============================================================
  actualizarGrafico(monto, totalIntereses);
}


/* ============================================================
   BLOQUE DE CÓDIGO — INTEGRANTE 6: TABLA Y GRÁFICOS
   ============================================================ */

// Función para generar dinámicamente la tabla de desglose de pagos mes a mes
function generarTablaAmortizacion(monto, tasaMensual, plazoMeses, cuotaMensual) {
  let saldo = monto;
  let totalIntereses = 0;
  const tbody = document.querySelector('#tablaAmortizacion tbody');

  if (tbody) tbody.innerHTML = ''; // Limpia ejecuciones anteriores

  for (let mes = 1; mes <= plazoMeses; mes++) {
    let interesMes = saldo * tasaMensual;
    let capitalMes = cuotaMensual - interesMes;

    saldo -= capitalMes;
    if (saldo < 0.01) saldo = 0; // Previene saldo negativo por redondeo decimal

    totalIntereses += interesMes;

    // Inyectar fila mes a mes en la tabla
    if (tbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${mes}</td>
        <td>${monedaActual}${cuotaMensual.toFixed(2)}</td>
        <td>${monedaActual}${capitalMes.toFixed(2)}</td>
        <td>${monedaActual}${interesMes.toFixed(2)}</td>
        <td>${monedaActual}${saldo.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  return totalIntereses;
}

// INTEGRANTE 6: Función con Chart.js para renderizar y actualizar el gráfico dinámico (Capital vs Intereses)
function actualizarGrafico(capital, intereses) {
  const canvas = document.getElementById('graficoPrestamo');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Si ya existe una gráfica previa, se destruye para que se redibuje limpiamente
  if (graficoInstancia) {
    graficoInstancia.destroy();
  }

  // Generación del gráfico pastel con Chart.js
  graficoInstancia = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Capital Principal', 'Intereses Totales'],
      datasets: [{
        data: [capital.toFixed(2), intereses.toFixed(2)],
        backgroundColor: ['#2563eb', '#ef4444'], // Azul para capital, rojo para intereses
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${monedaActual}${context.parsed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            }
          }
        }
      }
    }
  });
}
