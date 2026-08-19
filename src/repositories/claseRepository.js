import pool from '../database/db.js';

export default class ClaseRepository {
  getDetallePcmAsync = async (profeCursoMateriaId) => {
    const result = await pool.query(`
      SELECT
        pcm.id AS profe_curso_materia_id,
        p.id AS profesor_id,
        u.nombre AS profesor_nombre,
        u.apellido AS profesor_apellido,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        c.id AS curso_id,
        c.anio,
        c.division
      FROM profe_curso_materia pcm
      INNER JOIN profesor p ON p.id = pcm.profesor_id
      INNER JOIN usuario u ON u.id = p.usuario_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      WHERE pcm.id = $1
      LIMIT 1
    `, [profeCursoMateriaId]);

    return result.rows[0] || null;
  };

  // Get-or-create: si ya existe una clase para esa materia+fecha, la devuelve sin pisar tema/observaciones
  getOrCreateAsync = async ({ profe_curso_materia_id, fecha, tema, observaciones }) => {
    const existente = await pool.query(`
      SELECT * FROM clase WHERE profe_curso_materia_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE)
    `, [profe_curso_materia_id, fecha || null]);

    if (existente.rows[0]) return existente.rows[0];

    const result = await pool.query(`
      INSERT INTO clase (profe_curso_materia_id, fecha, tema, observaciones)
      VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4)
      RETURNING *
    `, [profe_curso_materia_id, fecha || null, tema || null, observaciones || null]);

    return result.rows[0];
  };

  getByIdAsync = async (id) => {
    const result = await pool.query(`
      SELECT
        cl.id AS clase_id,
        cl.fecha,
        cl.tema,
        cl.observaciones,
        cl.lista_cerrada,
        cl.fecha_creacion,
        pcm.id AS profe_curso_materia_id,
        p.id AS profesor_id,
        u.nombre AS profesor_nombre,
        u.apellido AS profesor_apellido,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        c.id AS curso_id,
        c.anio,
        c.division
      FROM clase cl
      INNER JOIN profe_curso_materia pcm ON pcm.id = cl.profe_curso_materia_id
      INNER JOIN profesor p ON p.id = pcm.profesor_id
      INNER JOIN usuario u ON u.id = p.usuario_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      WHERE cl.id = $1
    `, [id]);

    return result.rows[0] || null;
  };

  updateAsync = async (id, { tema, observaciones }) => {
    const result = await pool.query(`
      UPDATE clase
      SET tema = COALESCE($2, tema),
          observaciones = COALESCE($3, observaciones)
      WHERE id = $1
      RETURNING *
    `, [id, tema || null, observaciones || null]);

    return result.rows[0] || null;
  };

  cerrarAsync = async (id) => {
    const result = await pool.query(`
      UPDATE clase SET lista_cerrada = true WHERE id = $1 RETURNING *
    `, [id]);

    return result.rows[0] || null;
  };

  // Historial de clases de una materia, con el resumen de asistencia de cada una
  getByProfeCursoMateriaAsync = async (profeCursoMateriaId) => {
    const result = await pool.query(`
      SELECT
        cl.id AS clase_id,
        cl.fecha,
        cl.tema,
        cl.observaciones,
        cl.lista_cerrada,
        COUNT(a.id) FILTER (WHERE a.estado = 'presente') AS presentes,
        COUNT(a.id) FILTER (WHERE a.estado = 'ausente') AS ausentes,
        COUNT(a.id) FILTER (WHERE a.estado = 'tardanza') AS tardanzas,
        COUNT(a.id) FILTER (WHERE a.estado = 'justificado') AS justificados
      FROM clase cl
      LEFT JOIN asistencia a ON a.clase_id = cl.id
      WHERE cl.profe_curso_materia_id = $1
      GROUP BY cl.id
      ORDER BY cl.fecha DESC
    `, [profeCursoMateriaId]);

    return result.rows;
  };
}
