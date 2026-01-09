/**
 * Renderiza en el DOM el detalle de días hábiles
 * producido por sumarDiasHabilesJudiciales()
 *
 * @param {string[]} detalle
 * @param {HTMLElement} container
 * @param {number} totalHabiles
 */
export function renderDetalleDias(detalle, container, totalHabiles = null) {
    container.innerHTML = "";

    const table = document.createElement("table");
    table.className = "tabla-detalle";

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>#</th>
            <th>Fecha</th>
            <th>Estado</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    let contadorHabiles = 0;

    detalle.forEach(linea => {
        const tr = document.createElement("tr");

        // Separar partes
        const [fechaParte, estadoParte] = linea.split(" → ");
        const fechaTxt = fechaParte.replace(/\d{4}/, "").trim(); // sin año

        let colIndex = "–";
        let estadoTxt = "";
        let clase = "";

        if (estadoParte.startsWith("✅")) {
            contadorHabiles++;
            colIndex = contadorHabiles;
            estadoTxt = "hábil";
            clase = "habil";

            if (totalHabiles && contadorHabiles === totalHabiles) {
                estadoTxt += " ✅";
                clase += " ultimo";
            }
        } else {
            colIndex = "❌";
            clase = "no-habil";

            if (estadoParte.includes("Festivo")) estadoTxt = "festivo";
            else if (estadoParte.includes("Suspensión")) estadoTxt = "suspensión";
            else estadoTxt = "fin de semana";
        }

        tr.innerHTML = `
            <td class="idx">${colIndex}</td>
            <td>${fechaTxt}</td>
            <td>${estadoTxt}</td>
        `;

        tr.className = clase;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}
