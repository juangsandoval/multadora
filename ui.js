export function inicializarUIAuxiliar() {
  const grupoCondDias = document.getElementById("grupoPlazoCondicionalDias");
  const grupoCondFecha = document.getElementById("grupoPlazoCondicionalFecha");
  const grupoCumplDias = document.getElementById("grupoCumplimientoDias");
  const grupoCumplFecha = document.getElementById("grupoCumplimientoFecha");
  const btnAgregarAuto = document.getElementById("btnAgregarAuto");
  const autosContainer = document.getElementById("autosContainer");

  function refrescarModoCondicional() {
    const modo = document.querySelector("input[name='modoPlazoCondicional']:checked")?.value;
    if (grupoCondDias) grupoCondDias.style.display = (modo === "Días") ? "block" : "none";
    if (grupoCondFecha) grupoCondFecha.style.display = (modo === "Fecha") ? "block" : "none";
  }

  function refrescarModoCumplimiento() {
    const modo = document.querySelector("input[name='modoPlazoCumplimiento']:checked")?.value;
    if (grupoCumplDias) grupoCumplDias.style.display = (modo === "Días") ? "block" : "none";
    if (grupoCumplFecha) grupoCumplFecha.style.display = (modo === "Fecha") ? "block" : "none";
  }

  document
    .querySelectorAll("input[name='modoPlazoCondicional']")
    .forEach(r => r.addEventListener("change", refrescarModoCondicional));

  document
    .querySelectorAll("input[name='modoPlazoCumplimiento']")
    .forEach(r => r.addEventListener("change", refrescarModoCumplimiento));

  if (btnAgregarAuto && autosContainer) {
    btnAgregarAuto.addEventListener("click", () => {
      const autoDiv = document.createElement("div");
      autoDiv.className = "auto-adicional";

      const labelFechaAuto = document.createElement("label");
      labelFechaAuto.textContent = "Fecha auto: ";

      const inputFechaAuto = document.createElement("input");
      inputFechaAuto.type = "date";
      inputFechaAuto.className = "fecha-auto";
      labelFechaAuto.appendChild(inputFechaAuto);

      const labelPlazo = document.createElement("label");
      labelPlazo.textContent = "Plazo (días hábiles): ";

      const inputPlazo = document.createElement("input");
      inputPlazo.type = "number";
      inputPlazo.min = 0;
      inputPlazo.value = 0;
      inputPlazo.className = "plazo-auto";
      labelPlazo.appendChild(inputPlazo);

      const btnEliminar = document.createElement("button");
      btnEliminar.type = "button";
      btnEliminar.textContent = "🗑 Eliminar";
      btnEliminar.className = "btn-eliminar-auto";
      btnEliminar.addEventListener("click", () => autoDiv.remove());

      const hr = document.createElement("hr");

      autoDiv.append(labelFechaAuto, labelPlazo, btnEliminar, hr);
      autosContainer.appendChild(autoDiv);
    });
  }

  refrescarModoCondicional();
  refrescarModoCumplimiento();
}
