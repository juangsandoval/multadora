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
    const advertencias = [];

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
        if (auto.fechaAuto && auto.fechaEstado) {
            if (auto.fechaEstado < auto.fechaAuto) {
                errores.push(
                    `En el auto adicional #${i + 1}, la fecha de estado no puede ser anterior al auto.`
                );
            }
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
