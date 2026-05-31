import pool from '../database/db.js';

export default class MateriaRepository {
  getAllAsync = async (institucionId = null) => {
    const values = [];
    let filtro = '';

    if (institucionId) {
      values.push(institucionId);
      filtro = 'WHERE e.institucion_id = $1';
    }

    const result = await pool.query(`
      SELECT
        m.id AS materia_id,
        m.nombre,
        m.descripcion,
        e.id AS especialidad_id,
        e.nombre AS especialidad_nombre,
        e.institucion_id
      FROM materia m
      LEFT JOIN especialidad e ON e.id = m.especialidad_id
      ${filtro}
      ORDER BY m.nombre
    `, values);

    return result.rows;
  };
}