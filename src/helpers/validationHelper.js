export const missingFields = (body, requiredFields) => {
  return requiredFields.filter(field => {
    return body[field] === undefined || body[field] === null || body[field] === '';
  });
};
/** La nota debe ser un número entre 0 y 10 (admite decimales). */
export const notaValida = (nota) => {
  const n = Number(nota);
  return Number.isFinite(n) && n >= 0 && n <= 10;
};

const ESTADOS_ASISTENCIA = ['presente', 'ausente', 'tardanza', 'justificado'];

export const estadoAsistenciaValido = (estado) => {
  return ESTADOS_ASISTENCIA.includes(estado);
};
