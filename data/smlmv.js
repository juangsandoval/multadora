/*******************************************************
 * data/smlmv.js
 *
 * Tabla histórica del Salario Mínimo Legal
 * Mensual Vigente (SMLMV) en Colombia.
 *
 * ORIGEN:
 * - Diccionario SMLMV del script Python
 *
 * Valores en pesos colombianos (COP)
 *******************************************************/


/**
 * Salario Mínimo Legal Mensual Vigente por año
 *
 * ⚠️ IMPORTANTE:
 * - Los valores deben actualizarse si se extiende el uso
 *   de la app a años futuros.
 * - Este objeto es la ÚNICA fuente de verdad para SMLMV.
 */
export const SMLMV = {
    2015: 644350,
    2016: 689455,
    2017: 737717,
    2018: 781242,
    2019: 828116,
    2020: 877803,
    2021: 908526,
    2022: 1000000,
    2023: 1160000,
    2024: 1300000,
    2025: 1423500,
    2026: 1750905
};


/**
 * Obtiene el SMLMV para un año dado
 *
 * @param {number} year
 * @returns {number|null}
 */
export function obtenerSMLMV(year) {
    return SMLMV[year] ?? null;
}

