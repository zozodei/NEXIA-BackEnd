import pool from '../database/db.js';

export default class BimestreRepository {
  createAsync = async ({ institucion_id, nombre, anio, orden, fecha_inicio, fecha_fin }) => {
    const result = await pool.query(`
      INSERT INTO bimestre (institucion_id, nombre, anio, orden, fecha_inicio, fecha_fin)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      institucion_id,
      nombre,
      anio,
      orden,
      fecha_inicio || null,
      fecha_fin || null
    ]);

    return result.rows[0];
  };

  getByInstitucionAsync = async (institucionId) => {
    const result = await pool.query(`
      SELECT *
      FROM bimestre
      WHERE institucion_id = $1
      ORDER BY anio DESC, orden ASC
    `, [institucionId]);

    return result.rows;
  };

  getByIdAsync = async (id) => {
    const result = await pool.query(`
      SELECT * FROM bimestre WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
  };
}
