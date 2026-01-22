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
    detectarCruceSuspension,
    sumarDias,
    siguienteDiaHabil
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
   FUNCIONES DE AYUDA PARA CREAR LA TABLA DE RESUMEN
   ===================================================== */
function keyMes(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // 2026-01
}

function labelMes(key) {
  const [y, m] = key.split("-").map(Number);
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${meses[m - 1]} ${y}`;
}

function formatearDMY(fecha) {
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const yy = fecha.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function sumarUnDia(fecha) {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Cuenta días calendario sin suspensión, desglosado por mes.
 * Convención: cuenta en el intervalo [inicio, fin) => incluye inicio, excluye fin.
 */
function desglosePorMesSinSuspension(inicio, fin, fechasCierreSet) {
  const conteo = {};
  let d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  d.setDate(d.getDate() + 1);
  const end = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());

  while (d <= end) {
    const iso = d.toISOString().split("T")[0];
    if (!fechasCierreSet.has(iso)) {
      const k = keyMes(d);
      conteo[k] = (conteo[k] ?? 0) + 1;
    }
    d.setDate(d.getDate() + 1);
  }
  return conteo;
}

function generarResumenMensualRimbombante(periodos, fechasCierreSet) {
  const getPeriodo = (descExacta) => periodos.find(p => p.descripcion === descExacta) || null;

  // Base: tus 5 periodos "fijos" (cuando aplican)
  const pCumplInf = getPeriodo("Cumplimiento → Informe");
  const pInf10 = getPeriodo("Informe → +10 días (Art.120)");
  const pAutoEst = getPeriodo("Auto inicio → Estado");
  const pEstAcr = getPeriodo("Estado → Acreditación");
  const pAcr10 = getPeriodo("Acreditación → +10 días");

  // Construye filas base EN ORDEN (aunque alguna no aplique -> queda en 0 con N/A)
  const filasBase = [
    {
      id: "fila2",
      periodo: pCumplInf,
      actuacion: (p) => `El tiempo transcurrido entre el plazo máximo para dar cumplimiento a lo ordenado en la sentencia (${formatearDMY(p.inicio)}) y la fecha en que se informó el incumplimiento (${formatearDMY(p.fin)}).`
    },
    {
      id: "fila3",
      periodo: pInf10,
      actuacion: (p) => {
        const ini = sumarUnDia(p.inicio);
        return `El término transcurrido entre el día siguiente en que se informó el incumplimiento (${formatearDMY(ini)}) y el plazo máximo para expedir el auto con requerimiento de cumplimiento conforme al artículo 120 del CGP (${formatearDMY(p.fin)}).`;
      }
    },
    {
      id: "fila4",
      periodo: pAutoEst,
      actuacion: (p) => `El término transcurrido entre la numeración del auto de inicio (${formatearDMY(p.inicio)}) y su notificación mediante estado (${formatearDMY(p.fin)}).`
    },
    {
      id: "fila5",
      periodo: pEstAcr,
      actuacion: (p) => {
        const ini = sumarUnDia(p.inicio);
        return `El plazo otorgado en el auto de inicio para acreditar el cumplimiento: desde el día siguiente al estado del auto (${formatearDMY(ini)}) hasta (${formatearDMY(p.fin)}).`;
      }
    },
    {
      id: "fila6",
      periodo: pAcr10,
      actuacion: (p) => {
        const ini = sumarUnDia(p.inicio);
        return `El término transcurrido entre el día siguiente al vencimiento del plazo de acreditación (${formatearDMY(ini)}) y la fecha en la que se debió expedir la presente providencia (${formatearDMY(p.fin)}).`;
      }
    }
  ].map(item => {
    if (!item.periodo) {
      return {
        actuacion: "No aplica para este caso.",
        porMes: {},
        total: 0,
        baseId: item.id
      };
    }

    const porMes = desglosePorMesSinSuspension(item.periodo.inicio, item.periodo.fin, fechasCierreSet);
    const total = Object.values(porMes).reduce((a, b) => a + b, 0);
    return {
      actuacion: item.actuacion(item.periodo),
      porMes,
      total,
      baseId: item.id
    };
  });

  // Autos adicionales: detecta #n y crea filas extra con el mismo “estilo”
  // Usa tus descripciones actuales:
  // - Auto adicional #n (auto → estado)
  // - Plazo auto adicional #n
  // - +10 días auto adicional #n
  const filasAutos = [];
  const reNum = /#(\d+)/;

  const periodosAutos = periodos.filter(p =>
    p.descripcion.startsWith("Auto adicional #") ||
    p.descripcion.startsWith("Plazo auto adicional #") ||
    p.descripcion.startsWith("+10 días auto adicional #")
  );

  // Agrupar por n
  const porN = new Map();
  periodosAutos.forEach(p => {
    const m = p.descripcion.match(reNum);
    if (!m) return;
    const n = Number(m[1]);
    if (!porN.has(n)) porN.set(n, []);
    porN.get(n).push(p);
  });

  Array.from(porN.keys()).sort((a, b) => a - b).forEach(n => {
    const arr = porN.get(n);

    const pAutoEstado = arr.find(x => x.descripcion.startsWith(`Auto adicional #${n} (auto → estado)`));
    const pPlazo = arr.find(x => x.descripcion.startsWith(`Plazo auto adicional #${n}`));
    const pMas10 = arr.find(x => x.descripcion.startsWith(`+10 días auto adicional #${n}`));

    if (pAutoEstado) {
      const porMes = desglosePorMesSinSuspension(pAutoEstado.inicio, pAutoEstado.fin, fechasCierreSet);
      const total = Object.values(porMes).reduce((a, b) => a + b, 0);
      filasAutos.push({
        actuacion: `El término transcurrido entre la numeración del auto adicional #${n} (${formatearDMY(pAutoEstado.inicio)}) y su notificación mediante estado (${formatearDMY(pAutoEstado.fin)}).`,
        porMes,
        total
      });
    }

    if (pPlazo) {
      const porMes = desglosePorMesSinSuspension(pPlazo.inicio, pPlazo.fin, fechasCierreSet);
      const total = Object.values(porMes).reduce((a, b) => a + b, 0);
      filasAutos.push({
        actuacion: `El plazo otorgado en el auto adicional #${n} para acreditar el cumplimiento: desde el día siguiente al estado del auto (${formatearDMY(sumarUnDia(pPlazo.inicio))}) hasta (${formatearDMY(pPlazo.fin)}).`,
        porMes,
        total
      });
    }

    if (pMas10) {
      const porMes = desglosePorMesSinSuspension(pMas10.inicio, pMas10.fin, fechasCierreSet);
      const total = Object.values(porMes).reduce((a, b) => a + b, 0);
      filasAutos.push({
        actuacion: `El término transcurrido entre el día siguiente al vencimiento del plazo de acreditación del auto adicional #${n} (${formatearDMY(sumarUnDia(pMas10.inicio))}) y la fecha en la que se debió expedir la providencia correspondiente (${formatearDMY(pMas10.fin)}).`,
        porMes,
        total
      });
    }
  });

  const filas = [...filasBase, ...filasAutos];

  // Columnas = unión de todos los meses
  const mesesSet = new Set();
  filas.forEach(f => Object.keys(f.porMes).forEach(k => mesesSet.add(k)));

  const mesesKeys = Array.from(mesesSet).sort();
  const meses = mesesKeys.map(k => ({ key: k, label: labelMes(k) }));

  return { meses, filas };
}

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
    let detalleCumplimiento=[];
    if (modoPlazoCumplimiento === "Días") {
        const resultadoCumplimiento =
            sumarDiasHabilesJudiciales(
                fechaBaseCumplimiento,
                diasCumplimiento,
                festivos,
                FECHAS_CIERRE
        );
        
        fechaCumplimiento = resultadoCumplimiento.fechaFinal;
        detalleCumplimiento = resultadoCumplimiento.detalle;

    } else {
        if (!fechaLimiteCumplimiento) {
            throw new Error("Debe indicarse la fecha límite de cumplimiento.");
        }
        fechaCumplimiento = fechaLimiteCumplimiento;
    }

    /* =================================================
       4. INFORME (DDTE)
       ================================================= */

    const resultadoInforme =
  sumarDiasHabilesJudiciales(
      fechaCumplimiento,
      diasInforme,
      festivos,
      FECHAS_CIERRE
  );

    const fechaLimiteInforme = resultadoInforme.fechaFinal;
    const detalleInforme = resultadoInforme.detalle;


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
    let fechaEstadoAutoCalculada = null;

            if (fechaAutoInicio) {
                fechaEstadoAutoCalculada = siguienteDiaHabil(
                    fechaAutoInicio,
                    festivos,
                    FECHAS_CIERRE
                );
            }

    let fechaBaseMulta = fechaCumplimiento;

    if (fechaAutoInicio && fechaEstadoAutoCalculada) {

        const diasAuto =
            contarDiasCalendarioSinSuspension(
                fechaAutoInicio,
                fechaEstadoAutoCalculada,
                FECHAS_CIERRE
            );

        totalDias += diasAuto;

        periodos.push({
            descripcion: "Auto inicio → Estado",
            inicio: fechaAutoInicio,
            fin: fechaEstadoAutoCalculada
        });

        if (plazoAcreditacion > 0) {
            const fechaAcreditacion =
                sumarDiasHabilesJudiciales(
                    fechaEstadoAutoCalculada,
                    plazoAcreditacion,
                    festivos,
                    FECHAS_CIERRE
                ).fechaFinal;

            const diasAcreditacion =
                contarDiasCalendarioSinSuspension(
                    fechaEstadoAutoCalculada,
                    fechaAcreditacion,
                    FECHAS_CIERRE
                );

            totalDias += diasAcreditacion;

            periodos.push({
                descripcion: "Estado → Acreditación",
                inicio: fechaEstadoAutoCalculada,
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

const autosExtra = Array.isArray(autosAdicionales) ? autosAdicionales : [];

autosExtra.forEach((auto, index) => {
  // Si el auto viene vacío o inválido, lo ignoramos
  if (!auto?.fechaAuto || !auto?.plazoDias || auto.plazoDias <= 0) return;

  const fechaEstado = siguienteDiaHabil(
    auto.fechaAuto,
    festivos,
    FECHAS_CIERRE
  );

  const diasAuto = contarDiasCalendarioSinSuspension(
    auto.fechaAuto,
    fechaEstado,
    FECHAS_CIERRE
  );

  totalDias += diasAuto;

  periodos.push({
    descripcion: `Auto adicional #${index + 1} (auto → estado)`,
    inicio: auto.fechaAuto,
    fin: fechaEstado
  });

  const fechaLimitePlazo = sumarDiasHabilesJudiciales(
    fechaEstado,
    auto.plazoDias,
    festivos,
    FECHAS_CIERRE
  ).fechaFinal;

  const diasPlazo = contarDiasCalendarioSinSuspension(
    fechaEstado,
    fechaLimitePlazo,
    FECHAS_CIERRE
  );

  totalDias += diasPlazo;

  periodos.push({
    descripcion: `Plazo auto adicional #${index + 1}`,
    inicio: fechaEstado,
    fin: fechaLimitePlazo
  });

  const fecha10 = sumarDiasHabilesJudiciales(
    fechaLimitePlazo,
    10,
    festivos,
    FECHAS_CIERRE
  ).fechaFinal;

  const dias10 = contarDiasCalendarioSinSuspension(
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
    const fechaRealSancion = sumarDias(fechaCumplimiento, totalDias);
    const anioMulta = fechaRealSancion.getFullYear();
    const anioUVB = new Date().getFullYear();

    const multa = calcularMulta(totalDias, anioMulta, anioUVB);

    /* =================================================
       RESULTADO FINAL
       ================================================= */
    const resumenMensualRimbombante = generarResumenMensualRimbombante(periodos, FECHAS_CIERRE); // GENERAR EL RESUMEN PARA LA TABLA DEL AUTO DE MULTA

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
        multa,
        detalleDias: {
                  cumplimiento: detalleCumplimiento,
                  informe: detalleInforme
                },
        resumenMensualRimbombante,
    };
}















