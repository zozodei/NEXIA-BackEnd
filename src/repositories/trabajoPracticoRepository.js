import pool from '../database/db.js';

export default class TrabajoPracticoRepository {
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

  createAsync = async ({
    profe_curso_materia_id,
    titulo,
    descripcion,
    archivo_url,
    fecha_limite
  }) => {
    const result = await pool.query(`
      INSERT INTO trabajo_practico (
        profe_curso_materia_id, titulo, descripcion, archivo_url, fecha_limite, activo, fecha_publicacion
      )
      VALUES ($1, $2, $3, $4, $5, false, NULL)
      RETURNING *
    `, [
      profe_curso_materia_id,
      titulo,
      descripcion || null,
      archivo_url || null,
      fecha_limite || null
    ]);

    return result.rows[0];
  };

  updateAsync = async (id, { titulo, descripcion, archivo_url, fecha_limite }) => {
    const result = await pool.query(`
      UPDATE trabajo_practico
      SET
        titulo = COALESCE($2, titulo),
        descripcion = COALESCE($3, descripcion),
        archivo_url = COALESCE($4, archivo_url),
        fecha_limite = COALESCE($5, fecha_limite)
      WHERE id = $1
      RETURNING *
    `, [
      id,
      titulo || null,
      descripcion || null,
      archivo_url || null,
      fecha_limite || null
    ]);

    return result.rows[0] || null;
  };

  setEstadoAsync = async (id, activo) => {
    const result = await pool.query(`
      UPDATE trabajo_practico
      SET
        activo = $2,
        fecha_publicacion = CASE
          WHEN $2 = true AND fecha_publicacion IS NULL THEN NOW()
          ELSE fecha_publicacion
        END
      WHERE id = $1
      RETURNING *
    `, [id, activo]);

    return result.rows[0] || null;
  };

  getByIdAsync = async (id) => {
    const result = await pool.query(`
      SELECT
        tp.id AS trabajo_practico_id,
        tp.titulo,
        tp.descripcion,
        tp.archivo_url,
        tp.fecha_limite,
        tp.activo,
        tp.fecha_publicacion,
        pcm.id AS profe_curso_materia_id,
        p.id AS profesor_id,
        u.nombre AS profesor_nombre,
        u.apellido AS profesor_apellido,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        c.id AS curso_id,
        c.anio,
        c.division
      FROM trabajo_practico tp
      INNER JOIN profe_curso_materia pcm ON pcm.id = tp.profe_curso_materia_id
      INNER JOIN profesor p ON p.id = pcm.profesor_id
      INNER JOIN usuario u ON u.id = p.usuario_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      WHERE tp.id = $1
    `, [id]);

    return result.rows[0] || null;
  };

  getByProfeCursoMateriaAsync = async (profeCursoMateriaId, { soloActivos = false } = {}) => {
    const filtro = soloActivos ? 'AND tp.activo = true' : '';

    const result = await pool.query(`
      SELECT
        tp.id AS trabajo_practico_id,
        tp.titulo,
        tp.descripcion,
        tp.archivo_url,
        tp.fecha_limite,
        tp.activo,
        tp.fecha_publicacion,
        tp.profe_curso_materia_id
      FROM trabajo_practico tp
      WHERE tp.profe_curso_materia_id = $1
      ${filtro}
      ORDER BY tp.id DESC
    `, [profeCursoMateriaId]);

    return result.rows;
  };

  // TPs publicados visibles para un alumno, con el estado de su propia entrega
  getByAlumnoAsync = async (alumnoId) => {
    const result = await pool.query(`
      SELECT
        tp.id AS trabajo_practico_id,
        tp.titulo,
        tp.descripcion,
        tp.archivo_url,
        tp.fecha_limite,
        tp.fecha_publicacion,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        pcm.id AS profe_curso_materia_id,
        up.nombre AS profesor_nombre,
        up.apellido AS profesor_apellido,
        e.id AS entrega_id,
        e.archivo_url AS entrega_archivo_url,
        e.comentario_alumno,
        e.fecha_entrega,
        e.estado,
        e.nota,
        e.comentario_correccion,
        e.fecha_correccion
      FROM alumno a
      INNER JOIN curso_materia cm ON cm.curso_id = a.curso_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN profe_curso_materia pcm ON pcm.curso_materia_id = cm.id
      INNER JOIN profesor p ON p.id = pcm.profesor_id
      INNER JOIN usuario up ON up.id = p.usuario_id
      INNER JOIN trabajo_practico tp ON tp.profe_curso_materia_id = pcm.id AND tp.activo = true
      LEFT JOIN entrega e ON e.trabajo_practico_id = tp.id AND e.alumno_id = a.id
      WHERE a.id = $1
      ORDER BY tp.fecha_limite DESC NULLS LAST, tp.id DESC
    `, [alumnoId]);

    return result.rows;
  };

  // Vista del profesor: todos los alumnos del curso, con su entrega (si existe)
  getEntregasConNotasAsync = async (trabajoPracticoId) => {
    const result = await pool.query(`
      SELECT
        al.id AS alumno_id,
        u.nombre AS alumno_nombre,
        u.apellido AS alumno_apellido,
        e.id AS entrega_id,
        e.archivo_url,
        e.comentario_alumno,
        e.fecha_entrega,
        e.estado,
        e.nota,
        e.comentario_correccion,
        e.fecha_correccion
      FROM trabajo_practico tp
      INNER JOIN profe_curso_materia pcm ON pcm.id = tp.profe_curso_materia_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN alumno al ON al.curso_id = cm.curso_id
      INNER JOIN usuario u ON u.id = al.usuario_id
      LEFT JOIN entrega e ON e.trabajo_practico_id = tp.id AND e.alumno_id = al.id
      WHERE tp.id = $1
      ORDER BY u.apellido, u.nombre
    `, [trabajoPracticoId]);

    return result.rows;
  };

  // Detalle de notas de TP ya corregidas de un alumno (para el boletín)
  getNotasByAlumnoAsync = async (alumnoId) => {
    const result = await pool.query(`
      SELECT
        tp.id AS trabajo_practico_id,
        tp.titulo,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        e.nota,
        e.comentario_correccion,
        e.fecha_correccion
      FROM entrega e
      INNER JOIN trabajo_practico tp ON tp.id = e.trabajo_practico_id
      INNER JOIN profe_curso_materia pcm ON pcm.id = tp.profe_curso_materia_id
      -- Solo TPs de materias del curso actual del alumno (misma regla que el resto del boletín)
      INNER JOIN alumno a ON a.id = e.alumno_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id AND cm.curso_id = a.curso_id
      INNER JOIN materia m ON m.id = cm.materia_id
      WHERE e.alumno_id = $1 AND e.estado = 'corregido' AND tp.activo = true
      ORDER BY m.nombre, e.fecha_correccion DESC
    `, [alumnoId]);

    return result.rows;
  };
}
