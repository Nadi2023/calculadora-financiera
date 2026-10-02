/* ==========================================================
   LÓGICA PRINCIPAL — sincronización de inputs y cálculo
   ========================================================== */

const montoTexto    = document.getElementById('montoTexto');
const montoSlider    = document.getElementById('montoSlider');
const tasaTexto      = document.getElementById('tasaTexto');
const tasaSlider     = document.getElementById('tasaSlider');
const plazoTexto     = document.getElementById('plazoTexto');
const plazoSlider    = document.getElementById('plazoSlider');
const segmentoMoneda = document.getElementById('segmentoMoneda');
const simboloMonto   = document.getElementById('simboloMonto');
let monedaActual = '$';
const btnCalcular    = document.getElementById('btnCalcular');
const cuotaMensualEl    = document.getElementById('cuotaMensual');
const totalPagarEl      = document.getElementById('totalPagar');
const totalInteresesEl  = document.getElementById('totalIntereses');
const receiptResult  = document.getElementById('receiptResult');
const receiptLoader  = document.getElementById('receiptLoader');

// Actualiza la variable CSS --fill del slider según su valor actual,
// para que la barra se vea rellena desde el inicio hasta el cursor.
function actualizarRelleno(slider){
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const valor = parseFloat(slider.value);
  const porcentaje = ((valor - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', porcentaje + '%');
}

// Sincroniza un campo de texto con su slider en ambas direcciones
function sincronizar(texto, slider){
  actualizarRelleno(slider); // relleno inicial al cargar la página

  slider.addEventListener('input', () => {
    texto.value = slider.value;
    actualizarRelleno(slider);
    actualizarSimbolos();
  });
  texto.addEventListener('input', () => {
    const valor = parseFloat(texto.value.replace(/[^\d.]/g, ''));
    if(!isNaN(valor)){
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      slider.value = Math.min(Math.max(valor, min), max);
      actualizarRelleno(slider);
    }
  });
}

sincronizar(montoTexto, montoSlider);
sincronizar(tasaTexto, tasaSlider);
sincronizar(plazoTexto, plazoSlider);

function actualizarSimbolos(){
  simboloMonto.textContent = monedaActual;
}

// Segmentado de moneda: al hacer clic en un botón, se marca como
// activo, se actualiza el símbolo y se recalcula automáticamente.
segmentoMoneda.querySelectorAll('button').forEach(boton => {
  boton.addEventListener('click', () => {
    segmentoMoneda.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');
    monedaActual = boton.dataset.simbolo;
    actualizarSimbolos();
    calcularPrestamo();
  });
});

actualizarSimbolos();

// Formatea un número con separador de miles y 2 decimales
function formatoMoneda(valor, simbolo){
  return simbolo + valor.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2});
}

/* ----------------------------------------------------------
   Variable global con el último resultado calculado.
   Los Integrantes 6 y 7 pueden leer de aquí los datos que
   necesiten (monto, tasa, plazo, cuota, tabla de amortización)
   sin tener que recalcular nada por su cuenta.
   ---------------------------------------------------------- */
let resultadoCalculo = null;

// Genera el detalle mes a mes (capital, interés, saldo restante).
// Los Integrantes 6 y 7 pueden llamar a esta función para obtener
// los datos de cada cuota y así alimentar gráficos o tablas.
function generarTablaAmortizacion(monto, tasaMensual, plazoMeses, cuota){
  const tabla = [];
  let saldo = monto;
  for(let mes = 1; mes <= plazoMeses; mes++){
    const interesMes = saldo * tasaMensual;
    const capitalMes = cuota - interesMes;
    saldo = Math.max(saldo - capitalMes, 0);
    tabla.push({
      mes,
      cuota: cuota,
      interes: interesMes,
      capital: capitalMes,
      saldo: saldo
    });
  }
  return tabla;
}

function calcularPrestamo(){
  const monto = parseFloat(montoTexto.value.replace(/[^\d.]/g, '')) || 0;
  const tasaAnual = parseFloat(tasaTexto.value.replace(/[^\d.]/g, '')) || 0;
  const plazoMeses = parseInt(plazoTexto.value.replace(/[^\d]/g, '')) || 1;
  const simbolo = monedaActual;

  const tasaMensual = (tasaAnual / 100) / 12;

  let cuota;
  if(tasaMensual === 0){
    cuota = monto / plazoMeses;
  } else {
    const factor = Math.pow(1 + tasaMensual, plazoMeses);
    cuota = monto * (tasaMensual * factor) / (factor - 1);
  }

  const totalPagar = cuota * plazoMeses;
  const totalIntereses = totalPagar - monto;

  cuotaMensualEl.textContent = formatoMoneda(cuota, simbolo);
  totalPagarEl.textContent = formatoMoneda(totalPagar, simbolo);
  totalInteresesEl.textContent = formatoMoneda(totalIntereses, simbolo);

  // Guarda el resultado en la variable global y genera la tabla
  // de amortización para que los siguientes bloques la usen.
  resultadoCalculo = {
    monto, tasaAnual, plazoMeses, simbolo,
    cuotaMensual: cuota,
    totalPagar, totalIntereses,
    tabla: generarTablaAmortizacion(monto, tasaMensual, plazoMeses, cuota)
  };
    // Redibuja los gráficos del Integrante 7 — Cash Flow + Cash Balance
  if(typeof actualizarVisualizaciones === 'function'){
    actualizarVisualizaciones(resultadoCalculo);
  }
    // Redibuja el gráfico pastel y la tabla del Integrante 6 — Pastel + Tabla
  if(typeof actualizarVisualizacionesI6 === 'function'){
    actualizarVisualizacionesI6(resultadoCalculo);
  }

  /* ============================================================
     BLOQUE RESERVADO — INTEGRANTE 6 y 7
     Si necesitan disparar el redibujado del gráfico o de la
     tabla justo después de cada cálculo, este es el lugar
     indicado: llamen aquí a sus propias funciones, por ejemplo:
       actualizarGrafico(resultadoCalculo);
       renderizarTablaAmortizacion(resultadoCalculo.tabla);
     Si prefieren un archivo propio (ej. js/graficos.js), solo
     enlácenlo en index.html antes de este script.js y llamen
     su función aquí mismo.
     ============================================================ */

}

btnCalcular.addEventListener('click', () => {
  // Muestra la animación del billete flotando mientras "calcula"
  receiptResult.classList.add('fade-out');
  receiptLoader.classList.add('active');

  // Pequeña espera artificial para que la animación se note antes
  // de revelar el resultado (no es un cálculo real que tarde).
  setTimeout(() => {
    calcularPrestamo();
    receiptLoader.classList.remove('active');
    receiptResult.classList.remove('fade-out');
  }, 900);
});

// Cálculo inicial al cargar la página con los valores por defecto
// (sin animación, para que el recibo no aparezca vacío)
calcularPrestamo();

/* ============================================================
   BLOQUE RESERVADO — INTEGRANTE 8: PDF
   Si usan una librería externa como jsPDF, agreguen su
   <script src="..."> en index.html (antes de este archivo) y
   escriban aquí la función que arma el PDF a partir de
   "resultadoCalculo" (definida arriba en este mismo archivo).
   ============================================================ */