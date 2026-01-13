
export function numeroALetrasPesos(valor) {
  const n = Math.round(Number(valor) || 0);

  if (n === 0) return "CERO PESOS ($0)";

  const letras = numeroALetras(n);
  const sufijo = n === 1 ? "PESO" : "PESOS";
  return `${letras} ${sufijo}`.toUpperCase();
}

export function monedaALetrasCOP(valor) {
  const n = Number(valor ?? 0);
  if (!Number.isFinite(n)) return "cero pesos con cero centavos";

  const abs = Math.abs(n);

  // pesos y centavos (2 decimales)
  let pesos = Math.floor(abs);
  let centavos = Math.round((abs - pesos) * 100);

  // ajuste si por redondeo centavos=100
  if (centavos === 100) {
    pesos += 1;
    centavos = 0;
  }

  const signo = n < 0 ? "menos " : "";

  const pesosTxt = numeroALetras(pesos);
  const pesosLabel = pesos === 1 ? "peso" : "pesos";

  const centTxt = numeroALetras(centavos);
  const centLabel = centavos === 1 ? "centavo" : "centavos";

  return `${signo}${pesosTxt} ${pesosLabel} con ${centTxt} ${centLabel}`;
}


function numeroALetras(num) {
  if (num < 0) return `MENOS ${numeroALetras(Math.abs(num))}`;
  if (num === 0) return "cero";

  const unidades = [
    "", "uno", "dos", "tres", "cuatro", "cinco",
    "seis", "siete", "ocho", "nueve"
  ];

  const especiales = [
    "diez", "once", "doce", "trece", "catorce", "quince",
    "dieciséis", "diecisiete", "dieciocho", "diecinueve"
  ];

  const decenas = [
    "", "", "veinte", "treinta", "cuarenta", "cincuenta",
    "sesenta", "setenta", "ochenta", "noventa"
  ];

  const centenas = [
    "", "ciento", "doscientos", "trescientos", "cuatrocientos",
    "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"
  ];

  const apocoparUno = (s) => s.replace(/\buno\b/g, "un");

  const convertirMenor100 = (n) => {
    if (n < 10) return unidades[n];
    if (n < 20) return especiales[n - 10];
    if (n < 30) {
      if (n === 20) return "veinte";
      return `veinti${unidades[n - 20]}`;
    }
    const d = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? decenas[d] : `${decenas[d]} y ${unidades[u]}`;
  };

  const convertirMenor1000 = (n) => {
    if (n === 100) return "cien";
    if (n < 100) return convertirMenor100(n);
    const c = Math.floor(n / 100);
    const r = n % 100;
    return r === 0 ? centenas[c] : `${centenas[c]} ${convertirMenor100(r)}`;
  };

  const convertir = (n) => {
    if (n < 1000) return convertirMenor1000(n);

    if (n < 1_000_000) {
      const miles = Math.floor(n / 1000);
      const resto = n % 1000;
      const parteMiles = miles === 1 ? "mil" : `${apocoparUno(convertirMenor1000(miles))} mil`;
      return resto === 0 ? parteMiles : `${parteMiles} ${convertirMenor1000(resto)}`;
    }

    if (n < 1_000_000_000) {
      const millones = Math.floor(n / 1_000_000);
      const resto = n % 1_000_000;
      const parteMillones = millones === 1 ? "un millón" : `${apocoparUno(convertir(millones))} millones`;
      return resto === 0 ? parteMillones : `${parteMillones} ${convertir(resto)}`;
    }

    const milesMillones = Math.floor(n / 1_000_000_000);
    const resto = n % 1_000_000_000;
    const parteMM = milesMillones === 1 ? "mil millones" : `${apocoparUno(convertir(milesMillones))} mil millones`;
    return resto === 0 ? parteMM : `${parteMM} ${convertir(resto)}`;
  };

  return apocoparUno(convertir(num));
}
