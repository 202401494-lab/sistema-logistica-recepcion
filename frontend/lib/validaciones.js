/* Funciones de validación para formularios */
export const validarEmail = (email) => (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
);

/* Validación de contraseña: al menos 8 caracteres, una letra mayúscula, una letra minúscula y un número */
export const validarIdentificacion = (identificacion) => (
    /^[A-Za-z0-9][A-Za-z0-9-]{3,19}$/.test(identificacion)
);

export const convertirAISO = (fechaLocal) => {
    if (!fechaLocal) return '';

    const fecha = new Date(fechaLocal);

    if (Number.isNaN(fecha.getTime())) {
        return '';
    }

    return fecha.toISOString();
};

/* Validación de horario para citas */
export const validarHorario = ({
    fechaHoraProgramada,
    inicioVentana,
    finVentana,
    duracionEstimadaMinutos,
}) => {
    const inicio = new Date(inicioVentana);
    const fin = new Date(finVentana);
    const programada = new Date(fechaHoraProgramada);
    const duracion = Number(duracionEstimadaMinutos);

    /* Validaciones de los campos de fecha y hora */
    if (!Number.isFinite(duracion) || duracion <= 0) {
        return 'La duración debe ser mayor a cero.';
    }

    /* Validaciones de las fechas y horas */
    if (Number.isNaN(inicio.getTime())
        || Number.isNaN(fin.getTime())
        || Number.isNaN(programada.getTime())) {
        return 'Las fechas ingresadas no son válidas.';
    }

    if (fin <= inicio) {
        return 'La hora final debe ser posterior a la hora inicial.';
    }

    /* Validación de que la cita esté dentro del horario operativo y en la misma fecha */
    const mismaFecha = inicio.toDateString() === fin.toDateString();
    const domingo = inicio.getDay() === 0;

    if (!mismaFecha || domingo) {
        return 'La ventana debe comenzar y terminar el mismo día.';
    }

    // Mantiene RN-02 alineada con el horario validado por el backend.
    const fueraDeHorario = (
        inicio.getHours() < 7
        || fin.getHours() > 17
        || (fin.getHours() === 17 && fin.getMinutes() > 0)
    );

    if (fueraDeHorario) {
        return 'El horario operativo es de 07:00 a 17:00, de lunes a sábado.';
    }

    if (programada < inicio || programada > fin) {
        return 'La fecha programada debe estar dentro de la ventana.';
    }

    return '';
};