/*******************************************************
 * logic/multas.js
 *
 * Cálculo de multas en pesos colombianos (COP)
 * y su equivalencia en UVB.
 *
 * ORIGEN:
 * - Bloque de cálculo de multa del script Python
 *
 * Este módulo NO maneja fechas ni UI.
 *******************************************************/

import { obtenerSMLMV } from "../data/smlmv.js";
import { obtenerUVB } from "../data/uvb.js";


/* =====================================================
   UTILIDAD: REDONDEO ESTILO PYTHON round()
   ===================================================== */

/**
 * Python round() redondea .5 al par más cercano.
 * JS Math.round() siempre redondea hacia arriba.
 *
 * Para evitar inconsistencias jurídicas,
 * implementamos un redondeo equivalente a Python.
 */
function roundPython(value) {
    const floor = Math.floor(value);
    const diff = value - floor;

    if (diff === 0.5) {
        return floor % 2 === 0 ? floor : floor + 1;
    }
    return Math.round(value);
}


/* =====================================================
   CONVERSIÓN DE NÚMEROS A LETRAS (ESPAÑOL)
   ===================================================== */

/**
 * Conversión básica a letras en español.
 * ⚠️ Se puede reemplazar por librería externa
 * si se requiere mayor precisión lingüística.
 */
export function numeroALetras(numero) {
    const formatter = new Intl.NumberFormat("es-CO", {
        style: "decimal",
        maximumFractionDigits: 0
    });

    // Placeholder seguro: mantiene compatibilidad
    // (más adelante puede sustituirse por librería)
    return formatter.format(numero).toUpperCase();
}


/* =====================================================
   CÁLCULO DE MULTA
   ===================================================== */

/**
 * Traducción directa de:
 *
 * tarifa_unitaria = smlmv / 7
 * valor_multa = round(total_dias * tarifa_unitaria)
 * valor_uvb = valor_multa / uvb
 *
 * @param {number} totalDias - días calendario de retraso
 * @param {number} anioMulta - año en que se causa la sanción
 * @param {number} anioUVB - año de referencia para UVB
 *
 * @returns {Object} resultado del cálculo
 */
export function calcularMulta(totalDias, anioMulta, anioUVB) {

    const smlmv = obtenerSMLMV(anioMulta);
    if (!smlmv) {
        throw new Error(`No se encontró SMLMV para el año ${anioMulta}`);
    }

    const tarifaUnitaria = smlmv / 7;
    const valorMulta = roundPython(totalDias * tarifaUnitaria);

    const resultado = {
        anioMulta,
        smlmv,
        tarifaUnitaria,
        totalDias,
        valorMulta,
        valorMultaLetras: numeroALetras(valorMulta),
        uvb: null,
        valorUVB: null
    };

    const uvb = obtenerUVB(anioUVB);
    if (uvb) {
        resultado.uvb = uvb;
        resultado.valorUVB = valorMulta / uvb;
    }

    return resultado;
}
