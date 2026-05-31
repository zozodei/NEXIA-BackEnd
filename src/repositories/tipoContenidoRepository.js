import pool from '../database/db.js';

export default class TipoContenidoRepository {
  getAllAsync = async () => {
    const result = await pool.query(`
      SELECT *
      FROM tipo_contenido
      ORDER BY nombre
    `);

    return result.rows;
  };

  createAsync = async ({ nombre }) => {
    const result = await pool.query(`
      INSERT INTO tipo_contenido (nombre)
      VALUES ($1)
      RETURNING *
    `, [nombre]);

    return result.rows[0];
  };
}