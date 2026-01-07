/*******************************************************
 * logic/fechas.js
 *
 * Traducción directa desde Python a JavaScript
 * del motor de cómputo de términos judiciales.
 *
 * ORIGEN:
 * - sumar_dias_habiles_judiciales
 * - contar_dias_calendario_sin_suspension
 * - detectar_cruce_suspension
 * - utilidades de fechas
 *
 * ⚠️ Este archivo NO toca DOM ni UI
 *******************************************************/


/* =====================================================
   UTILIDADES BÁSICAS DE FECHAS
   ===================================================== */

/**
 * Clona una fecha para evitar mutaciones
 */
export function clonarFecha(fecha) {
    return new Date(fecha.getTime());
}

/**
 * Suma días calendario a una fecha
 */
export function sumarDias(fecha, dias) {
    const f = clonarFecha(fecha);
    f.setDate(f.getDate() + dias);
    return f;
}

/**
 * Compara solo fecha (ignora hora)
 */
export function mismaFecha(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/**
 * Convierte Date → string YYYY-MM-DD
 * (útil para Sets y comparaciones rápidas)
 */
export function fechaKey(fecha) {
    return fecha.toISOString().split("T")[0];
}


/* =====================================================
   DÍAS DE LA SEMANA (equivalente a dias_semana_es)
   ===================================================== */

export const DIAS_SEMANA_ES = {
    0: "dom",
    1: "lun",
    2: "mar",
    3: "mié",
    4: "jue",
    5: "vie",
    6: "sáb"
};


/* =====================================================
   DETECCIÓN DE CRUCES CON SUSPENSIONES
   (equivalente a detectar_cruce_suspension)
   ===================================================== */

/**
 * Devuelve las resoluciones cuya suspensión
 * se cruza con el tramo [inicio, fin]
 */
export function detectarCruceSuspension(inicio, fin, resoluciones) {
    const cruces = [];

    resoluciones.forEach(r => {
        if (inicio <= r.fin_dt && fin >= r.inicio_dt) {
            cruces.push(r);
        }
    });

    return cruces;
}


/* =====================================================
   SUMAR DÍAS HÁBILES JUDICIALES
   (corazón del sistema)
   ===================================================== */

/**
 * Traducción directa de:
 * sumar_dias_habiles_judiciales(fecha_inicio, cantidad, festivos)
 *
 * @param {Date} fechaInicio - fecha base
 * @param {number} cantidad - días hábiles a sumar
 * @param {Set<string>} festivos - fechas YYYY-MM-DD
 * @param {Set<string>} fechasCierre - suspensiones judiciales
 *
 * @returns {Object} { fechaFinal: Date, detalle: string[] }
 */
export function sumarDiasHabilesJudiciales(
    fechaInicio,
    cantidad,
    festivos,
    fechasCierre
) {
    let actual = sumarDias(fechaInicio, 1);
    let contador = 0;
    const detalle = [];

    while (contador < cantidad) {

        const key = fechaKey(actual);
        let estado = "";
        let razon = "";

        if (fechasCierre.has(key)) {
            estado = "❌ No cuenta";
            razon = "Suspensión";
        }
        else if (actual.getDay() === 0 || actual.getDay() === 6) {
            estado = "❌ No cuenta";
            razon = "Fin de semana";
        }
        else if (festivos.has(key)) {
            estado = "❌ No cuenta";
            razon = "Festivo";
        }
        else {
            estado = "✅ Día Hábil";
            contador++;
        }

        const diaEs = DIAS_SEMANA_ES[actual.getDay()];
        detalle.push(
            `${diaEs} ${actual.toLocaleDateString("es-CO")} → ${estado}${razon ? " (" + razon + ")" : ""}`
        );

        actual = sumarDias(actual, 1);
    }

    const fechaFinal = sumarDias(actual, -1);
    return { fechaFinal, detalle };
}


/* =====================================================
   CONTAR DÍAS CALENDARIO (SIN SUSPENSIÓN)
   ===================================================== */

/**
 * Traducción de:
 * contar_dias_calendario_sin_suspension
 *
 * Cuenta desde el día siguiente a inicio
 */
export function contarDiasCalendarioSinSuspension(
    inicio,
    fin,
    fechasCierre
) {
    let dias = 0;
    let actual = sumarDias(inicio, 1);

    while (actual <= fin) {
        if (!fechasCierre.has(fechaKey(actual))) {
            dias++;
        }
        actual = sumarDias(actual, 1);
    }

    return dias;
}


/**
 * Traducción de:
 * contar_dias_incluyendo_inicio_sin_suspension
 */
export function contarDiasIncluyendoInicioSinSuspension(
    inicio,
    fin,
    fechasCierre
) {
    let dias = 0;
    let actual = clonarFecha(inicio);

    while (actual <= fin) {
        if (!fechasCierre.has(fechaKey(actual))) {
            dias++;
        }
        actual = sumarDias(actual, 1);
    }

    return dias;
}
