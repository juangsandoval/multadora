/*******************************************************
 * data/uvb.js
 *
 * Tabla histórica de la Unidad de Valor Básico (UVB)
 * utilizada para expresar el valor de la multa.
 *
 * ORIGEN:
 * - Diccionario UVB del script Python
 *
 * Valores en pesos colombianos (COP)
 *******************************************************/


/**
 * Unidad de Valor Básico (UVB) por año
 *
 * ⚠️ IMPORTANTE:
 * - El cálculo en UVB se hace usando el año ACTUAL
 *   (date.today().year en Python).
 * - Mantener esta tabla actualizada cada año.
 */
export const UVB = {
    2023: 10000,
    2024: 10951,
    2025: 11552,
    2026: 12110
};


/**
 * Obtiene el valor de la UVB para un año dado
 *
 * @param {number} year
 * @returns {number|null}
 */
export function obtenerUVB(year) {
    return UVB[year] ?? null;
}

