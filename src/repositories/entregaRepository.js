import pool from '../database/db.js';

export default class EntregaRepository {
  getByAlumnoYTpAsync = async (trabajoPracticoId, alumnoId) => {
    const result = await pool.query(`
      SELECT *
      FROM entrega
      WHERE trabajo_practico_id = $1 AND alumno_id = $2
    `, [trabajoPracticoId, alumnoId]);

    return result.rows[0] || null;
  };

  // Una sola fila por alumno/TP: si ya existía la entrega, se reemplaza (queda en estado 'pendiente' de nuevo)
  upsertAsync = async ({ trabajo_practico_id, alumno_id, archivo_url, comentario_alumno }) => {
    const result = await pool.query(`
      INSERT INTO entrega (
        trabajo_practico_id, alumno_id, archivo_url, comentario_alumno, estado
      )
      VALUES ($1, $2, $3, $4, 'pendiente')
      ON CONFLICT (trabajo_practico_id, alumno_id)
      DO UPDATE SET
        archivo_url = EXCLUDED.archivo_url,
        comentario_alumno = EXCLUDED.comentario_alumno,
        fecha_entrega = NOW(),
        estado = 'pendiente',
        nota = NULL,
        comentario_correccion = NULL,
        fecha_correccion = NULL
      RETURNING *
    `, [trabajo_practico_id, alumno_id, archivo_url, comentario_alumno || null]);

    return result.rows[0];
  };

  calificarAsync = async ({ trabajo_practico_id, alumno_id, nota, comentario_correccion }) => {
    const result = await pool.query(`
      UPDATE entrega
      SET
        nota = $3,
        comentario_correccion = $4,
        estado = 'corregido',
        fecha_correccion = NOW()
      WHERE trabajo_practico_id = $1 AND alumno_id = $2
      RETURNING *
    `, [trabajo_practico_id, alumno_id, nota, comentario_correccion || null]);

    return result.rows[0] || null;
  };
}
