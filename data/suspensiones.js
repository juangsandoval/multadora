/*******************************************************
 * data/suspensiones.js
 *
 * Datos normativos de suspensiones judiciales
 * y resoluciones que suspenden términos.
 *
 * ORIGEN:
 * - cierres_judiciales (rangos de fechas)
 * - RESOLUCIONES_SUSPENSION
 *
 * ⚠️ Archivo de SOLO DATOS
 *******************************************************/


/* =====================================================
   1. CIERRES JUDICIALES (rangos)
   ===================================================== */

/**
 * Traducción directa de la lista:
 * cierres_judiciales = [
 *   ("01/01/2020", "10/01/2020"),
 *   ("17/03/2020", "30/06/2020"),
 *   ...
 * ]
 *
 * Fechas en formato ISO (YYYY-MM-DD) para evitar ambigüedad
 */
export const CIERRES_JUDICIALES = [
    ["2020-01-01", "2020-01-10"],
    ["2020-03-17", "2020-06-30"],
    ["2020-11-13", null],
    ["2020-12-19", "2021-01-11"],
    ["2021-03-12", null],
    ["2021-09-06", null],
    ["2021-12-20", "2022-01-10"],
    ["2022-12-19", "2023-01-11"],
    ["2023-09-12", "2023-09-15"],
    ["2023-10-18", null],
    ["2023-11-24", null],
    ["2023-11-27", null],
    ["2023-11-28", null],
    ["2023-12-20", "2024-01-14"],
    ["2024-04-19", null],
    ["2024-04-24", "2024-06-10"],
    ["2024-08-27", "2024-08-28"],
    ["2024-03-18", null],
    ["2024-12-20", "2025-01-10"],
    ["2025-12-22", "2026-01-9"]
];


/* =====================================================
   2. RESOLUCIONES DE SUSPENSIÓN DE TÉRMINOS
   ===================================================== */

/**
 * Traducción directa de RESOLUCIONES_SUSPENSION
 * Se normalizan fechas y se crean Date automáticamente
 */
export const RESOLUCIONES_SUSPENSION = [

    /* -------------------- 2019 -------------------- */
    {
        resolucion: "Resolución No. 89072 del 7 de diciembre de 2019",
        inicio: "2019-01-02",
        fin: "2019-01-09"
    },
    {
        resolucion: "Resolución No. 27362 del 11 de julio de 2019",
        inicio: "2019-07-11",
        fin: "2019-07-11"
    },
    {
        resolucion: "Resolución No. 63613 del 15 de noviembre de 2019",
        inicio: "2019-12-03",
        fin: "2019-12-03"
    },
    {
        resolucion: "Resolución No. 64600 del 20 de noviembre de 2019",
        inicio: "2019-12-30",
        fin: "2020-01-10"
    },

    /* -------------------- 2020 -------------------- */
    {
        resolucion: "Resolución No. 11790 del 16 de marzo de 2020",
        inicio: "2020-03-17",
        fin: "2020-04-30"
    },
    {
        resolucion: "Resolución No. 19831 del 30 de abril de 2020",
        inicio: "2020-05-01",
        fin: "2020-05-30"
    },
    {
        resolucion: "Resolución No. 24907 del 29 de mayo de 2020",
        inicio: "2020-05-01",
        fin: "2020-06-30"
    },
    {
        resolucion: "Resolución No. 70723 del 6 de noviembre de 2020",
        inicio: "2020-11-13",
        fin: "2020-11-13"
    },
    {
        resolucion: "Resolución No. 77618 del 1 de diciembre de 2020",
        inicio: "2020-12-19",
        fin: "2021-01-11"
    },

    /* -------------------- 2021 -------------------- */
    {
        resolucion: "Resolución No. 12748 del 11 de marzo de 2021",
        inicio: "2021-03-12",
        fin: "2021-03-12"
    },
    {
        resolucion: "Resolución No. 57281 del 6 de septiembre de 2021",
        inicio: "2021-09-06",
        fin: "2021-09-06"
    },
    {
        resolucion: "Resolución No. 79759 del 6 de diciembre de 2021",
        inicio: "2021-12-20",
        fin: "2022-01-10"
    },

    /* -------------------- 2022 -------------------- */
    {
        resolucion: "Resolución No. 87558 del 9 de diciembre de 2022",
        inicio: "2022-12-19",
        fin: "2023-01-11"
    },

    /* -------------------- 2023 -------------------- */
    {
        resolucion: "Resolución No. 54645 del 12 de septiembre de 2023",
        inicio: "2023-09-12",
        fin: "2023-09-13"
    },
    {
        resolucion: "Resolución No. 54656 del 13 de septiembre de 2023",
        inicio: "2023-09-14",
        fin: "2023-09-15"
    },
    {
        resolucion: "Resolución No. 63599 del 18 de octubre de 2023",
        inicio: "2023-10-18",
        fin: "2023-10-18"
    },
    {
        resolucion: "Resolución No. 72982 del 21 de noviembre de 2023",
        inicio: "2023-11-24",
        fin: "2023-11-27"
    },
    {
        resolucion: "Resolución No. 74254 del 28 de noviembre de 2023",
        inicio: "2023-11-28",
        fin: "2023-11-28"
    },
    {
        resolucion: "Resolución No. 79172 del 14 de diciembre de 2023",
        inicio: "2023-12-20",
        fin: "2024-01-14"
    },

    /* -------------------- 2024 -------------------- */
    {
        resolucion: "Resolución No. 18987 del 18 de abril de 2024",
        inicio: "2024-04-24",
        fin: "2024-06-10"
    },
    {
        resolucion: "Resolución No. 48972 del 27 de agosto de 2024",
        inicio: "2024-08-27",
        fin: "2024-08-27"
    },
    {
        resolucion: "Resolución No. 49390 del 28 de agosto de 2024",
        inicio: "2024-08-28",
        fin: "2024-08-28"
    },
    {
        resolucion: "Resolución No. 77546 del 11 de diciembre de 2024",
        inicio: "2024-12-20",
        fin: "2025-01-10"
    },
   /*---------------------2025---------------------------*/
   {
      resolucion: "Resolución No. 106340 del 12 de diciembre de 2025",
      inicio: "2025-12-22",
      fin: "2026-01-09"
   }
];


/* =====================================================
   3. EXPANSIÓN DE CIERRES A SET DE FECHAS
   ===================================================== */

/**
 * Equivalente al bloque Python:
 *
 * fechas_cierre = set()
 * for inicio, fin in cierres_judiciales:
 *   ...
 */
export function generarSetFechasCierre() {
    const fechas = new Set();

    CIERRES_JUDICIALES.forEach(([inicioStr, finStr]) => {
        let actual = new Date(inicioStr);
        const fin = finStr ? new Date(finStr) : new Date(inicioStr);

        while (actual <= fin) {
            fechas.add(actual.toISOString().split("T")[0]);
            actual.setDate(actual.getDate() + 1);
        }
    });

    return fechas;
}


/* =====================================================
   4. NORMALIZAR RESOLUCIONES (añadir Date)
   ===================================================== */

/**
 * Añade inicio_dt y fin_dt como Date,
 * igual que en el script Python
 */
export function normalizarResoluciones() {
    return RESOLUCIONES_SUSPENSION.map(r => ({
        ...r,
        inicio_dt: new Date(r.inicio),
        fin_dt: new Date(r.fin)
    }));
}

