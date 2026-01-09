/*******************************************************
 * logic/calculos.js
 *
 * Orquestador principal del cómputo jurídico.
 *
 * Reproduce el flujo completo del script Python:
 * - Notificación
 * - Ejecutoria
 * - Obligación condicional
 * - Cumplimiento (Ddo)
 * - Informe (Ddte)
 * - Autos (principal y adicionales)
 * - Acreditación
 * - +10 días (art. 120 CGP)
 * - Total de días
 * - Detección de suspensiones
 * - Multa
 *
 * ⚠️ NO maneja UI
 *******************************************************/
import { generarFestivosCO } from "../data/festivos.js";
import {
    sumarDiasHabilesJudiciales,
    contarDiasCalendarioSinSuspension,
    detectarCruceSuspension
} from "./fechas.js";

import { calcularMulta } from "./multas.js";

import {
    generarSetFechasCierre,
    normalizarResoluciones
} from "../data/suspensiones.js";


/* =====================================================
   CONTEXTO GLOBAL DE SUSPENSIONES
   ===================================================== */

const FECHAS_CIERRE = generarSetFechasCierre();
const RESOLUCIONES = normalizarResoluciones();


/* =====================================================
   FUNCIÓN PRINCIPAL
   ===================================================== */

/**
 * Ejecuta el cómputo completo del caso
 *
 * @param {Object} params - datos del formulario
 * @returns {Object} resultado estructurado
 */
export function calcularCaso(params) {

    const {
        fechaNotificacion,
        tipoNotificacion,           // "Estados" | "Estrados" | "Ob. Condicional"
        fechaInforme,
        modoPlazoCondicional,       // "Días" | "Fecha"
        plazoCondicionalDias,
        fechaLimiteCondicional,
        fechaCumplidaCondicional,
        modoPlazoCumplimiento,      // "Días" | "Fecha"
        diasCumplimiento,
        fechaLimiteCumplimiento,
        diasInforme,
        fechaAutoInicio,
        fechaEstadoAuto,
        plazoAcreditacion,
        autosAdicionales            // array de autos
    } = params;

    /* -------------------------------------------------
       Validaciones mínimas (las fuertes van en UI)
       ------------------------------------------------- */
    if (!fechaNotificacion || !fechaInforme) {
        throw new Error("Faltan fechas obligatorias.");
    }

    /* -------------------------------------------------
       Festivos mediante consulta al archivo festivos.js
       -------------------------------------------------
    */
    const anioInicio = fechaNotificacion.getFullYear(); //obtiene el año para la fecha de notificación de la providencia
    const anioFin = new Date().getFullYear() + 1;
    const festivos = generarFestivosCO(anioInicio, anioFin);

    /* =================================================
       1. EJECUTORIA
       ================================================= */

    const diasEjecutoria = (tipoNotificacion === "Estados") ? 3 : 0;

    const { fechaFinal: fechaEjecutoria } =
        sumarDiasHabilesJudiciales(
            fechaNotificacion,
            diasEjecutoria,
            festivos,
            FECHAS_CIERRE
        );

    /* =================================================
       2. OBLIGACIÓN CONDICIONAL
       ================================================= */

    let fechaLimiteObligacion;

    if (modoPlazoCondicional === "Días") {
        if (plazoCondicionalDias > 0) {
            fechaLimiteObligacion =
                sumarDiasHabilesJudiciales(
                    fechaEjecutoria,
                    plazoCondicionalDias,
                    festivos,
                    FECHAS_CIERRE
                ).fechaFinal;
        } else {
            fechaLimiteObligacion = fechaEjecutoria;
        }
    } else {
        if (!fechaLimiteCondicional) {
            throw new Error("Debe indicarse fecha límite de obligación condicional.");
        }
        fechaLimiteObligacion = fechaLimiteCondicional;
    }

    let fechaBaseCumplimiento;
    let cumplimientoOportuno = null;

    if (fechaCumplidaCondicional) {
        fechaBaseCumplimiento = fechaCumplidaCondicional;
        cumplimientoOportuno = fechaCumplidaCondicional <= fechaLimiteObligacion;
    } else {
        if (plazoCondicionalDias > 0) {
            throw new Error("No se acreditó cumplimiento de la obligación condicional.");
        }
        fechaBaseCumplimiento = fechaEjecutoria;
    }

    /* =================================================
       3. CUMPLIMIENTO (DDO)
       ================================================= */

    let fechaCumplimiento;

    if (modoPlazoCumplimiento === "Días") {
        fechaCumplimiento =
            sumarDiasHabilesJudiciales(
                fechaBaseCumplimiento,
                diasCumplimiento,
                festivos,
                FECHAS_CIERRE
            ).fechaFinal;
    } else {
        if (!fechaLimiteCumplimiento) {
            throw new Error("Debe indicarse la fecha límite de cumplimiento.");
        }
        fechaCumplimiento = fechaLimiteCumplimiento;
    }

    /* =================================================
       4. INFORME (DDTE)
       ================================================= */

    const fechaLimiteInforme =
        sumarDiasHabilesJudiciales(
            fechaCumplimiento,
            diasInforme,
            festivos,
            FECHAS_CIERRE
        ).fechaFinal;

    let informeEntendido = new Date(fechaInforme);

    while (
        FECHAS_CIERRE.has(informeEntendido.toISOString().split("T")[0]) ||
        informeEntendido.getDay() === 0 ||
        informeEntendido.getDay() === 6 ||
        festivos.has(informeEntendido.toISOString().split("T")[0])
    ) {
        informeEntendido.setDate(informeEntendido.getDate() + 1);
    }

    let estadoInforme;
    if (fechaInforme <= fechaCumplimiento) {
        estadoInforme = "PRETEMPORE";
    } else if (fechaInforme > fechaLimiteInforme) {
        estadoInforme = "EXTEMPORÁNEO";
    } else {
        estadoInforme = "OPORTUNO";
    }

    /* =================================================
       5. CÓMPUTO DE DÍAS CALENDARIO
       ================================================= */

    const periodos = [];
    let totalDias = 0;

    // Tramo cumplimiento → informe
    const diasRetraso =
        contarDiasCalendarioSinSuspension(
            fechaCumplimiento,
            informeEntendido,
            FECHAS_CIERRE
        );

    totalDias += diasRetraso;

    periodos.push({
        descripcion: "Cumplimiento → Informe",
        inicio: fechaCumplimiento,
        fin: informeEntendido
    });

    /* =================================================
       6. +10 DÍAS ART. 120 DESDE INFORME
       ================================================= */

    const fecha10Informe =
        sumarDiasHabilesJudiciales(
            informeEntendido,
            10,
            festivos,
            FECHAS_CIERRE
        ).fechaFinal;

    const dias10Informe =
        contarDiasCalendarioSinSuspension(
            informeEntendido,
            fecha10Informe,
            FECHAS_CIERRE
        );

    totalDias += dias10Informe;

    periodos.push({
        descripcion: "Informe → +10 días (Art.120)",
        inicio: informeEntendido,
        fin: fecha10Informe
    });

    /* =================================================
       7. AUTO DE INICIO Y ACREDITACIÓN
       ================================================= */

    let fechaBaseMulta = fechaCumplimiento;

    if (fechaAutoInicio && fechaEstadoAuto) {

        const diasAuto =
            contarDiasCalendarioSinSuspension(
                fechaAutoInicio,
                fechaEstadoAuto,
                FECHAS_CIERRE
            );

        totalDias += diasAuto;

        periodos.push({
            descripcion: "Auto inicio → Estado",
            inicio: fechaAutoInicio,
            fin: fechaEstadoAuto
        });

        if (plazoAcreditacion > 0) {
            const fechaAcreditacion =
                sumarDiasHabilesJudiciales(
                    fechaEstadoAuto,
                    plazoAcreditacion,
                    festivos,
                    FECHAS_CIERRE
                ).fechaFinal;

            const diasAcreditacion =
                contarDiasCalendarioSinSuspension(
                    fechaEstadoAuto,
                    fechaAcreditacion,
                    FECHAS_CIERRE
                );

            totalDias += diasAcreditacion;

            periodos.push({
                descripcion: "Estado → Acreditación",
                inicio: fechaEstadoAuto,
                fin: fechaAcreditacion
            });

            const fecha10Acreditacion =
                sumarDiasHabilesJudiciales(
                    fechaAcreditacion,
                    10,
                    festivos,
                    FECHAS_CIERRE
                ).fechaFinal;

            const dias10Acreditacion =
                contarDiasCalendarioSinSuspension(
                    fechaAcreditacion,
                    fecha10Acreditacion,
                    FECHAS_CIERRE
                );

            totalDias += dias10Acreditacion;

            periodos.push({
                descripcion: "Acreditación → +10 días",
                inicio: fechaAcreditacion,
                fin: fecha10Acreditacion
            });

            fechaBaseMulta = fecha10Acreditacion;
        }
    }

    /* =================================================
       8. AUTOS ADICIONALES
       ================================================= */

    autosAdicionales.forEach((auto, index) => {

        const diasAuto =
            contarDiasCalendarioSinSuspension(
                auto.fechaAuto,
                auto.fechaEstado,
                FECHAS_CIERRE
            );

        totalDias += diasAuto;

        periodos.push({
            descripcion: `Auto adicional #${index + 1}`,
            inicio: auto.fechaAuto,
            fin: auto.fechaEstado
        });

        if (auto.plazoDias > 0) {
            const fechaLimitePlazo =
                sumarDiasHabilesJudiciales(
                    auto.fechaEstado,
                    auto.plazoDias,
                    festivos,
                    FECHAS_CIERRE
                ).fechaFinal;

            const diasPlazo =
                contarDiasCalendarioSinSuspension(
                    auto.fechaEstado,
                    fechaLimitePlazo,
                    FECHAS_CIERRE
                );

            totalDias += diasPlazo;

            periodos.push({
                descripcion: `Plazo auto adicional #${index + 1}`,
                inicio: auto.fechaEstado,
                fin: fechaLimitePlazo
            });

            const fecha10 =
                sumarDiasHabilesJudiciales(
                    fechaLimitePlazo,
                    10,
                    festivos,
                    FECHAS_CIERRE
                ).fechaFinal;

            const dias10 =
                contarDiasCalendarioSinSuspension(
                    fechaLimitePlazo,
                    fecha10,
                    FECHAS_CIERRE
                );

            totalDias += dias10;

            periodos.push({
                descripcion: `+10 días auto adicional #${index + 1}`,
                inicio: fechaLimitePlazo,
                fin: fecha10
            });

            fechaBaseMulta = fecha10;
        }
    });

    /* =================================================
       9. DETECCIÓN DE RESOLUCIONES
       ================================================= */

    const resolucionesAfectadas = new Set();

    periodos.forEach(p => {
        detectarCruceSuspension(p.inicio, p.fin, RESOLUCIONES)
            .forEach(r => resolucionesAfectadas.add(r.resolucion));
    });

    /* =================================================
       10. MULTA
       ================================================= */

    const anioMulta = fechaBaseMulta.getFullYear();
    const anioUVB = new Date().getFullYear();

    const multa = calcularMulta(totalDias, anioMulta, anioUVB);

    /* =================================================
       RESULTADO FINAL
       ================================================= */

    return {
        fechas: {
            fechaEjecutoria,
            fechaLimiteObligacion,
            fechaCumplimiento,
            fechaLimiteInforme,
            informeEntendido
        },
        estadoInforme,
        cumplimientoOportuno,
        totalDias,
        periodos,
        resolucionesAfectadas: Array.from(resolucionesAfectadas),
        multa
    };
}


