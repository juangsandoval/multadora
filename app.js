/*******************************************************
 * app.js
 *
 * Capa de integración:
 * UI (HTML) ↔ Motor jurídico (logic/)
 *******************************************************/

import { calcularCaso } from "./logic/calculos.js";
import { validarCaso } from "./logic/validaciones.js";
import { renderDetalleDias } from "./modulos/renderDetalleDias.js";
import { sumarDiasHabilesJudiciales} from "./logic/fechas.js"; 
import { numeroALetrasPesos } from "./logic/numerosALetras.js";
import { monedaALetrasCOP } from "./logic/numerosALetras.js";
import { inicializarUIAuxiliar } from "./ui.js";

inicializarUIAuxiliar();

let resultadoActual = null;
let datosActual = null;



/* =====================================================
   UTILIDADES
   ===================================================== */

function parseFecha(valor) {
    return valor ? new Date(valor + "T00:00:00") : null;
}

function parseNumero(valor, defecto = 0) {
    const n = parseInt(valor, 10);
    return isNaN(n) ? defecto : n;
}

function limpiar(elemento) {
    elemento.innerHTML = "";
}
//==============FUNCIÓN PPAL PARA LA TABLA
function renderResumenMensual(resumen) {
  const cont = document.getElementById("resumenMensual");
  cont.innerHTML = "";

  if (!resumen?.meses?.length || !resumen?.filas?.length) {
    cont.textContent = "No hay información para mostrar.";
    return;
  }

  const table = document.createElement("table");
  table.className = "tabla-resumen";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  const thAct = document.createElement("th");
  thAct.textContent = "Actuación";
  trh.appendChild(thAct);

  resumen.meses.forEach(m => {
    const th = document.createElement("th");
    th.textContent = m.label;
    trh.appendChild(th);
  });

  const thTot = document.createElement("th");
  thTot.textContent = "Total";
  trh.appendChild(thTot);

  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  resumen.filas.forEach(fila => {
    const tr = document.createElement("tr");

    const tdAct = document.createElement("td");
    tdAct.textContent = fila.actuacion;
    tr.appendChild(tdAct);

    let suma = 0;
    resumen.meses.forEach(m => {
      const v = fila.porMes[m.key] ?? 0;
      suma += v;

      const td = document.createElement("td");
      td.textContent = String(v);
      tr.appendChild(td);
    });

    const tdTot = document.createElement("td");
    tdTot.textContent = String(fila.total ?? suma);
    tr.appendChild(tdTot);

    tbody.appendChild(tr);
  });
//=======FILA PARA CONOCER EL TOTAL

   // ---- Fila final TOTAL (suma por columna) ----
   const trTotal = document.createElement("tr");
   trTotal.className = "fila-total";
   
   const tdLabel = document.createElement("td");
   tdLabel.textContent = "TOTAL";
   trTotal.appendChild(tdLabel);
   
   let totalGeneral = 0;
   
   resumen.meses.forEach(m => {
     let sumaMes = 0;
   
     resumen.filas.forEach(f => {
       sumaMes += (f.porMes?.[m.key] ?? 0);
     });
   
     totalGeneral += sumaMes;
   
     const td = document.createElement("td");
     td.textContent = String(sumaMes);
     trTotal.appendChild(td);
   });
   
     const tdTotal = document.createElement("td");
     tdTotal.textContent = String(totalGeneral);
     trTotal.appendChild(tdTotal);
      
     tbody.appendChild(trTotal);
    
     table.appendChild(tbody);
     cont.appendChild(table);
}

/* =====================================================
   LECTURA DEL FORMULARIO
   ===================================================== */

function leerFormulario() {
    return {
        fechaNotificacion: parseFecha(document.getElementById("fechaNotificacion").value),
        tipoNotificacion: document.getElementById("tipoNotificacion").value,

        modoPlazoCondicional: document.querySelector("input[name='modoPlazoCondicional']:checked").value,
        plazoCondicionalDias: parseNumero(document.getElementById("plazoCondicionalDias").value),
        fechaLimiteCondicional: parseFecha(document.getElementById("fechaLimiteCondicional").value),
        fechaCumplidaCondicional: parseFecha(document.getElementById("fechaCumplidaCondicional").value),

        modoPlazoCumplimiento: document.querySelector("input[name='modoPlazoCumplimiento']:checked").value,
        diasCumplimiento: parseNumero(document.getElementById("diasCumplimiento").value),
        fechaLimiteCumplimiento: parseFecha(document.getElementById("fechaLimiteCumplimiento").value),

        diasInforme: parseNumero(document.getElementById("diasInforme").value),
        fechaInforme: parseFecha(document.getElementById("fechaInforme").value),

        fechaAutoInicio: parseFecha(document.getElementById("fechaAutoInicio").value),
        plazoAcreditacion: parseNumero(document.getElementById("plazoAcreditacion").value),

        autosAdicionales: leerAutosAdicionales()
    };
}


/* =====================================================
   AUTOS ADICIONALES
   ===================================================== */

function leerAutosAdicionales() {
  const autos = [];

  document.querySelectorAll(".auto-adicional").forEach(div => {
    const fechaAuto = parseFecha(div.querySelector(".fecha-auto").value);
    const plazoDias = parseNumero(div.querySelector(".plazo-auto").value);

    // 👇 Si el bloque está vacío, NO lo mandes al motor
    if (!fechaAuto && plazoDias === 0) return;

    autos.push({ fechaAuto, plazoDias });
  });

  return autos;
}

/* =====================================================
   RENDER DE RESULTADOS: se modificó la función por otra
   ===================================================== */

/*function renderResultado(resultado) {
  const salida = document.getElementById("salida");
  limpiar(salida);

  const f = resultado.fechas;
  const valorMulta = Number(resultado?.multa?.valorMulta ?? 0);

  const multaFormateada = valorMulta.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  salida.innerHTML = `
    <h3>📌 Resultado del cómputo</h3>

    <p><b>Ejecutoria:</b> ${f.fechaEjecutoria.toLocaleDateString()}</p>
    <p><b>Fecha límite obligación condicional:</b> ${f.fechaLimiteObligacion.toLocaleDateString()}</p>
    <p><b>Fecha cumplimiento (Ddo):</b> ${f.fechaCumplimiento.toLocaleDateString()}</p>
    <p><b>Fecha límite informe (Ddte):</b> ${f.fechaLimiteInforme.toLocaleDateString()}</p>
    <p><b>Informe entendido el:</b> ${f.informeEntendido.toLocaleDateString()}</p>

    <p><b>Estado del informe:</b> ${resultado.estadoInforme}</p>
    <p><b>Total días calendario:</b> ${resultado.totalDias}</p>
    <p><b>Días totales de atraso:</b> ${resultado.diasCumplimientoAAutoEstado ?? "N/D"}</p>

    <h4>💰 Multa</h4>
    <p><b>Año sanción:</b> ${resultado.multa.anioMulta}</p>
    <p><b>Valor multa:</b> ${multaFormateada}</p>
    <p><b>Equivalente UVB:</b> ${resultado.multa.valorUVB?.toFixed(2) ?? "N/D"}</p>
  `;

  // --- Multa en spans (número + letras) ---
  const multaEnLetras = numeroALetrasPesos(valorMulta);
  document.getElementById("multaLetras").textContent = `${multaEnLetras} (${multaFormateada})`;

  if (resultado.resolucionesAfectadas.length) {
    salida.innerHTML += `
      <h4>📜 Resoluciones aplicables</h4>
      <ul>
        ${resultado.resolucionesAfectadas.map(r => `<li>${r}</li>`).join("")}
      </ul>
    `;
  }
}*/
function formatearFecha(fecha) {
  if (!fecha) return "N/D";
  return fecha.toLocaleDateString("es-CO");
}

function formatearMoneda(valor) {
  return Number(valor ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function renderPreviewProvidencia(resultado, datos) {
  const preview = document.getElementById("preview");
  const layout = document.querySelector(".layout");

  if (!preview || !layout) return;

  const f = resultado.fechas;
  const multa = resultado.multa || {};

  const multaLinea = `${numeroALetrasPesos(multa.valorMulta ?? 0)} (${formatearMoneda(multa.valorMulta)})`;
  const valorUVB = multa.valorUVB != null ? multa.valorUVB.toFixed(2) : "N/D";
  const tarifaMulta = formatearMoneda(multa.tarifaUnitaria);

  preview.innerHTML = `
    <h3>📄 Datos para providencia</h3>

    <div class="preview-card">
      <p><strong>Fecha de notificación:</strong> ${formatearFecha(datos.fechaNotificacion)}</p>
      <p><strong>Fecha de la noticia de incumplimiento:</strong> ${formatearFecha(datos.fechaInforme)}</p>
      <p><strong>Fecha del auto:</strong> ${formatearFecha(datos.fechaAutoInicio)}</p>
      <p><strong>Fecha de notificación del auto:</strong> ${formatearFecha(f.fechaEstadoAutoInicio)}</p>
      <p><strong>Fecha límite para cumplir:</strong> ${formatearFecha(f.fechaCumplimiento)}</p>
      <p><strong>Días totales (cumplimiento a estado auto inicio):</strong> ${resultado.diasCumplimientoAAutoEstado ?? "N/D"}</p>
      <p><strong>Fecha del plazo máximo para expedir el auto:</strong> ${formatearFecha(f.fechaPlazoMaximoAuto)}</p>
      <p><strong>Fecha en la que se debió expedir la presente providencia:</strong> ${formatearFecha(f.fechaDebioExpedirseProvidencia)}</p>
      <p><strong>Valor de la multa:</strong> ${multaLinea}</p>
      <p><strong>Total días calendario:</strong> ${resultado.totalDias}</p>
      <p><strong>Año de la multa:</strong> ${multa.anioMulta ?? "N/D"}</p>
      <p><strong>Valor UVB:</strong> ${valorUVB}</p>
      <p><strong>Tarifa de la multa:</strong> ${tarifaMulta}</p>
    </div>
  `;

  layout.classList.remove("layout-centrado");
  layout.classList.add("layout-dos-columnas");
}

function renderResultado(resultado) {
  const salida = document.getElementById("salida");
  limpiar(salida);

  const f = resultado.fechas;
  const valorMulta = Number(resultado?.multa?.valorMulta ?? 0);

  const multaFormateada = valorMulta.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  salida.innerHTML = `
    <h3>📌 Resultado del cómputo</h3>

    <p><b>Ejecutoria:</b> ${f.fechaEjecutoria.toLocaleDateString()}</p>
    <p><b>Fecha límite obligación condicional:</b> ${f.fechaLimiteObligacion.toLocaleDateString()}</p>
    <p><b>Fecha cumplimiento (Ddo):</b> ${f.fechaCumplimiento.toLocaleDateString()}</p>
    <p><b>Fecha límite para noticia (Ddte):</b> ${f.fechaLimiteInforme.toLocaleDateString()}</p>
    <p><b>Noticia entendido el:</b> ${f.informeEntendido.toLocaleDateString()}</p>
    <p><b>Estado de la noticia:</b> ${resultado.estadoInforme}</p>

  `;

  if (resultado.resolucionesAfectadas.length) {
    salida.innerHTML += `
      <h4>📜 Resoluciones aplicables</h4>
      <ul>
        ${resultado.resolucionesAfectadas.map(r => `<li>${r}</li>`).join("")}
      </ul>
    `;
  }
}


/* =====================================================
   RENDER DE ERRORES DE VALIDACIÓN
   ===================================================== */

function renderErroresValidacion(errores) {
    const salida = document.getElementById("salida");
    limpiar(salida);

    salida.innerHTML = `
        <h4 style="color:#b91c1c;">⚠️ Errores de validación</h4>
        <ul>
            ${errores.map(e => `<li>${e}</li>`).join("")}
        </ul>
    `;
}

/* =====================================================
   EVENTOS DE LOS BOTONES
   ===================================================== */
/*BOTON DE CALCULAR*/
document.getElementById("btnCalcular").addEventListener("click", () => {

    const datos = leerFormulario();
    datosActual = datos;

    const validacion = validarCaso(datos);
    if (!validacion.esValido) {
        renderErroresValidacion(validacion.errores);
        return;
    }

    try {
         resultadoActual = calcularCaso(datos);
         renderResultado(resultadoActual);
         renderPreviewProvidencia(resultadoActual, datosActual); /*SE AGREGA EL PREVIEW DE DATOS*/
         renderResumenMensual(resultadoActual.resumenMensualRimbombante);
    } catch (error) {
        renderErroresValidacion([error.message]);
    }
});


/*BOTON DE DETALLE*/

document.getElementById("btnDetalle").addEventListener("click", () => {
    if (!resultadoActual) {
        alert("Primero debes calcular el caso.");
        return;
    }

    // 1) Detalle cumplimiento (si aplica)
  renderDetalleDias(
    resultadoActual.detalleDias.cumplimiento,
    document.getElementById("detalleDias"),
    (datosActual?.modoPlazoCumplimiento === "Días") ? datosActual.diasCumplimiento : null
  );

  // 2) Detalle término para informar (Ddte)
  renderDetalleDias(
    resultadoActual.detalleDias.informe,
    document.getElementById("detalleDiasInforme"),
    datosActual?.diasInforme ?? null
  );
   
});

document.getElementById("btnCopiarResumen").addEventListener("click", async () => {
  const table = document.querySelector("#resumenMensual table");
  if (!table) return alert("No hay tabla para copiar.");

  const html = table.outerHTML;
  const text = table.innerText;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" })
      })
    ]);
    alert("Tabla copiada. Pégala en Word.");
  } catch (e) {
    // fallback simple
    await navigator.clipboard.writeText(text);
    alert("Copiado como texto (fallback).");
  }
});
