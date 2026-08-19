import pool from '../database/db.js';

export default class AsistenciaRepository {
  // Roster del curso de la clase, con el estado ya cargado si existe (para armar/editar la grilla)
  getGrillaAsync = async (claseId) => {
    const result = await pool.query(`
      SELECT
        al.id AS alumno_id,
        u.nombre AS alumno_nombre,
        u.apellido AS alumno_apellido,
        ast.id AS asistencia_id,
        COALESCE(ast.estado, 'presente') AS estado,
        ast.observaciones,
        ast.fecha_registro,
        ast.fecha_modificacion
      FROM clase cl
      INNER JOIN profe_curso_materia pcm ON pcm.id = cl.profe_curso_materia_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN alumno al ON al.curso_id = cm.curso_id
      INNER JOIN usuario u ON u.id = al.usuario_id
      LEFT JOIN asistencia ast ON ast.clase_id = cl.id AND ast.alumno_id = al.id
      WHERE cl.id = $1
      ORDER BY u.apellido, u.nombre
    `, [claseId]);

    return result.rows;
  };

  upsertAsync = async ({ clase_id, alumno_id, estado, observaciones, registrado_por }) => {
    const result = await pool.query(`
      INSERT INTO asistencia (clase_id, alumno_id, estado, observaciones, registrado_por)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (clase_id, alumno_id)
      DO UPDATE SET
        estado = EXCLUDED.estado,
        observaciones = EXCLUDED.observaciones,
        registrado_por = EXCLUDED.registrado_por,
        fecha_modificacion = NOW()
      RETURNING *
    `, [clase_id, alumno_id, estado, observaciones || null, registrado_por]);

    return result.rows[0];
  };

  // Historial de asistencia de un alumno, opcionalmente filtrado por materia
  getByAlumnoAsync = async (alumnoId, profeCursoMateriaId) => {
    const filtro = profeCursoMateriaId ? 'AND pcm.id = $2' : '';
    const params = profeCursoMateriaId ? [alumnoId, profeCursoMateriaId] : [alumnoId];

    const result = await pool.query(`
      SELECT
        ast.id,
        ast.estado,
        ast.observaciones,
        cl.id AS clase_id,
        cl.fecha,
        cl.tema,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        pcm.id AS profe_curso_materia_id
      FROM asistencia ast
      INNER JOIN clase cl ON cl.id = ast.clase_id
      INNER JOIN profe_curso_materia pcm ON pcm.id = cl.profe_curso_materia_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      WHERE ast.alumno_id = $1
      ${filtro}
      ORDER BY cl.fecha DESC
    `, params);

    return result.rows;
  };

  // % de asistencia de un alumno en una materia puntual (presentes sobre el total de clases con lista tomada)
  getPorcentajeAsync = async (alumnoId, profeCursoMateriaId) => {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE ast.estado = 'presente') AS presentes,
        COUNT(*) FILTER (WHERE ast.estado = 'ausente') AS ausentes,
        COUNT(*) FILTER (WHERE ast.estado = 'tardanza') AS tardanzas,
        COUNT(*) FILTER (WHERE ast.estado = 'justificado') AS justificados,
        COUNT(*) AS total_clases,
        ROUND(
          COUNT(*) FILTER (WHERE ast.estado = 'presente')::numeric
          / NULLIF(COUNT(*), 0) * 100, 1
        ) AS porcentaje_asistencia
      FROM asistencia ast
      INNER JOIN clase cl ON cl.id = ast.clase_id
      WHERE ast.alumno_id = $1
        AND cl.profe_curso_materia_id = $2
    `, [alumnoId, profeCursoMateriaId]);

    return result.rows[0];
  };
}
