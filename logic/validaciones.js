/*******************************************************
 * logic/validaciones.js
 *
 * Validaciones jurídicas y cronológicas
 * del formulario de cómputo.
 *
 * NO maneja UI
 *******************************************************/

export function validarCaso(params) {

    const errores = [];
    const advertencias = []; /* VARIABLE SIN USAR*/

    const {
        fechaNotificacion,
        fechaInforme,
        fechaAutoInicio,
        fechaEstadoAuto,
        modoPlazoCondicional,
        fechaLimiteCondicional,
        modoPlazoCumplimiento,
        fechaLimiteCumplimiento,
        autosAdicionales
    } = params;

    /* ===============================
       VALIDACIONES CRONOLÓGICAS
       =============================== */

    if (fechaNotificacion && fechaInforme) {
        if (fechaInforme <= fechaNotificacion) {
            errores.push(
                "La noticia de incumplimiento debe ser posterior a la notificación."
            );
        }
    }

    if (fechaAutoInicio && fechaInforme) {
        if (fechaAutoInicio < fechaInforme) {
            errores.push(
                "El auto de inicio debe ser igual o posterior a la noticia de incumplimiento."
            );
        }
    }

    if (fechaAutoInicio && fechaEstadoAuto) {
        if (fechaEstadoAuto < fechaAutoInicio) {
            errores.push(
                "La fecha de estado del auto debe ser igual o posterior al auto."
            );
        }
    }

    /* ===============================
       VALIDACIONES POR MODO
       =============================== */

    if (modoPlazoCondicional === "Fecha" && !fechaLimiteCondicional) {
        errores.push(
            "Debe indicar la fecha límite de la obligación condicional."
        );
    }

    if (modoPlazoCumplimiento === "Fecha" && !fechaLimiteCumplimiento) {
        errores.push(
            "Debe indicar la fecha límite de cumplimiento (Ddo)."
        );
    }

    /* ===============================
       AUTOS ADICIONALES
       =============================== */

autosAdicionales.forEach((auto, i) => {

    if (!auto.fechaAuto && !auto.fechaEstado && auto.plazoDias === 0) {
        return; // bloque vacío, se ignora
    }

    if (!auto.fechaAuto) {
        errores.push(`En el auto adicional #${i + 1}, falta la fecha del auto.`);
    }

    if (!auto.fechaEstado) {
        errores.push(`En el auto adicional #${i + 1}, falta la fecha del estado.`);
    }

    if (auto.plazoDias <= 0) {
        errores.push(`En el auto adicional #${i + 1}, el plazo debe ser mayor a cero.`);
    }

    if (auto.fechaAuto && auto.fechaEstado && auto.fechaEstado < auto.fechaAuto) {
        errores.push(
            `En el auto adicional #${i + 1}, la fecha de estado no puede ser anterior al auto.`
        );
    }
});


    /* ===============================
       RESULTADO
       =============================== */

    return {
        esValido: errores.length === 0,
        errores,
        advertencias
    };
}

