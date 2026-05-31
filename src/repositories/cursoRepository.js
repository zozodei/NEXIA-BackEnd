import pool from '../database/db.js';

export default class CursoRepository {
  getAllAsync = async (institucionId = null) => {
    const values = [];
    let filtro = '';

    if (institucionId) {
      values.push(institucionId);
      filtro = 'WHERE c.institucion_id = $1';
    }

    const result = await pool.query(`
      SELECT
        c.id AS curso_id,
        c.institucion_id,
        c.anio,
        c.division,
        e.id AS especialidad_id,
        e.nombre AS especialidad_nombre
      FROM curso c
      LEFT JOIN especialidad e ON e.id = c.especialidad_id
      ${filtro}
      ORDER BY c.anio, c.division
    `, values);

    return result.rows;
  };
}