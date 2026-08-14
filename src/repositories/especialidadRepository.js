import pool from '../database/db.js';

export default class EspecialidadRepository {
  getAllByInstitucionAsync = async (institucionId) => {
    const result = await pool.query(`
      SELECT
        e.id AS especialidad_id,
        e.nombre,
        e.institucion_id,
        (SELECT COUNT(*)::int FROM curso c WHERE c.especialidad_id = e.id) AS cantidad_cursos
      FROM especialidad e
      WHERE e.institucion_id = $1
      ORDER BY e.nombre
    `, [institucionId]);

    return result.rows;
  };
}
