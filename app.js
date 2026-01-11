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

let resultadoActual =null;


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
   RENDER DE RESULTADOS
   ===================================================== */

function renderResultado(resultado) {
    const salida = document.getElementById("salida");
    limpiar(salida);

    const f = resultado.fechas;

    salida.innerHTML = `
        <h3>📌 Resultado del cómputo</h3>

        <p><b>Ejecutoria:</b> ${f.fechaEjecutoria.toLocaleDateString()}</p>
        <p><b>Fecha límite obligación condicional:</b> ${f.fechaLimiteObligacion.toLocaleDateString()}</p>
        <p><b>Fecha cumplimiento (Ddo):</b> ${f.fechaCumplimiento.toLocaleDateString()}</p>
        <p><b>Fecha límite informe (Ddte):</b> ${f.fechaLimiteInforme.toLocaleDateString()}</p>
        <p><b>Informe entendido el:</b> ${f.informeEntendido.toLocaleDateString()}</p>

        <p><b>Estado del informe:</b> ${resultado.estadoInforme}</p>
        <p><b>Total días calendario:</b> ${resultado.totalDias}</p>

        <h4>💰 Multa</h4>
        <p><b>Año sanción:</b> ${resultado.multa.anioMulta}</p>
        <p><b>Valor multa:</b> $${resultado.multa.valorMulta.toLocaleString()}</p>
        <p><b>Equivalente UVB:</b> ${resultado.multa.valorUVB?.toFixed(2) ?? "N/D"}</p>
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
   EVENTOS
   ===================================================== */

document.getElementById("btnCalcular").addEventListener("click", () => {

    const datos = leerFormulario();

    const validacion = validarCaso(datos);
    if (!validacion.esValido) {
        renderErroresValidacion(validacion.errores);
        return;
    }

    try {
        resultadoActual = calcularCaso(datos);
        renderResultado(resultadoActual);
    } catch (error) {
        renderErroresValidacion([error.message]);
    }
});

document.getElementById("btnDetalle").addEventListener("click", () => {
    if (!resultadoActual) {
        alert("Primero debes calcular el caso.");
        return;
    }

    renderDetalleDias(
        resultadoActual.detalleDias.cumplimiento,
        document.getElementById("detalleDias")
    );
});








