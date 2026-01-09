// data/festivos.js

/**
 * Devuelve un Set de festivos de Colombia
 * entre dos años (inclusive)
 *
 * @param {number} desde
 * @param {number} hasta
 * @returns {Set<string>} YYYY-MM-DD
 */
export function generarFestivosCO(desde, hasta) {

    const festivos = new Set();

    const FESTIVOS_POR_ANIO = {
        2014: [
            "2014-01-01",
            "2014-01-06",
            "2014-03-24",
            "2014-04-17",
            "2014-04-18",
            "2014-05-01",
            "2014-06-02",
            "2014-06-23",
            "2014-06-30",
            "2014-07-20",
            "2014-08-07",
            "2014-08-18",
            "2014-10-13",
            "2014-11-03",
            "2014-11-17",
            "2014-12-08",
            "2014-12-25"
        ],
        // ...
        2024: [
            "2024-01-01",
            "2024-01-08",
            "2024-03-25",
            "2024-03-28",
            "2024-03-29",
            "2024-05-01",
            "2024-05-13",
            "2024-06-03",
            "2024-06-10",
            "2024-07-01",
            "2024-07-20",
            "2024-08-07",
            "2024-08-19", // 👈 clave
            "2024-10-14",
            "2024-11-04",
            "2024-11-11",
            "2024-12-08",
            "2024-12-25"
        ]
        // 2025–2027...
    };

    for (let anio = desde; anio <= hasta; anio++) {
        (FESTIVOS_POR_ANIO[anio] || []).forEach(f => festivos.add(f));
    }

    return festivos;
}
