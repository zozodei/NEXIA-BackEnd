import pool from '../database/db.js';

export default class ComunicadoRepository {
  createAsync = async ({ institucion_id, gestor_id, titulo, contenido, imagen_url }) => {
    const result = await pool.query(`
      INSERT INTO comunicado (institucion_id, gestor_id, titulo, contenido, imagen_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [institucion_id, gestor_id, titulo, contenido, imagen_url || null]);

    return result.rows[0];
  };

  getAllByInstitucionAsync = async (institucion_id) => {
    const result = await pool.query(`
      SELECT
        c.id,
        c.titulo,
        c.contenido,
        c.fecha_publicacion,
        c.activo,
        c.imagen_url,
        g.id AS gestor_id,
        g.nombre AS gestor_nombre,
        i.id AS institucion_id,
        i.nombre AS institucion_nombre
      FROM comunicado c
      INNER JOIN gestor g ON g.id = c.gestor_id
      INNER JOIN institucion i ON i.id = c.institucion_id
      WHERE c.institucion_id = $1 AND c.activo = true
      ORDER BY c.fecha_publicacion DESC
    `, [institucion_id]);

    return result.rows;
  };
}
