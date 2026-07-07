import pool from '../database/db.js';

export default class AlumnoRepository {
  getAllAsync = async (institucionId = null) => {
    const values = [];
    let filtro = '';

    if (institucionId) {
      values.push(institucionId);
      filtro = 'WHERE u.institucion_id = $1';
    }

    const result = await pool.query(`
      SELECT
        a.id AS alumno_id,
        u.id AS usuario_id,
        u.institucion_id,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.activo,
        c.id AS curso_id,
        c.anio,
        c.division
      FROM alumno a
      INNER JOIN usuario u ON u.id = a.usuario_id
      INNER JOIN curso c ON c.id = a.curso_id
      ${filtro}
      ORDER BY u.apellido, u.nombre
    `, values);

    return result.rows;
  };

  getByIdAsync = async (alumnoId) => {
    const result = await pool.query(`
      SELECT
        a.id AS alumno_id,
        u.id AS usuario_id,
        u.institucion_id,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.activo,
        c.id AS curso_id,
        c.anio,
        c.division
      FROM alumno a
      INNER JOIN usuario u ON u.id = a.usuario_id
      INNER JOIN curso c ON c.id = a.curso_id
      WHERE a.id = $1
    `, [alumnoId]);

    return result.rows[0] || null;
  };

  getMateriasConContenidosAsync = async (alumnoId) => {
    const result = await pool.query(`
      SELECT
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        m.descripcion AS materia_descripcion,
        c.id AS curso_id,
        c.anio,
        c.division,
        pcm.id AS profe_curso_materia_id,
        up.nombre AS profesor_nombre,
        up.apellido AS profesor_apellido,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'contenido_id', con.id,
              'titulo', con.titulo,
              'descripcion', con.descripcion,
              'archivo_url', con.archivo_url,
              'fecha_creacion', con.fecha_creacion,
              'tipo_contenido_id', tc.id,
              'tipo_contenido', tc.nombre,
              'profesor_id', p.id,
              'profesor_nombre', up.nombre,
              'profesor_apellido', up.apellido
            )
          ) FILTER (WHERE con.id IS NOT NULL),
          '[]'
        ) AS contenidos
      FROM alumno a
      INNER JOIN curso c ON c.id = a.curso_id
      INNER JOIN curso_materia cm ON cm.curso_id = c.id
      INNER JOIN materia m ON m.id = cm.materia_id
      LEFT JOIN profe_curso_materia pcm ON pcm.curso_materia_id = cm.id
      LEFT JOIN profesor p ON p.id = pcm.profesor_id
      LEFT JOIN usuario up ON up.id = p.usuario_id
      LEFT JOIN contenido con ON con.profe_curso_materia_id = pcm.id
      LEFT JOIN tipo_contenido tc ON tc.id = con.tipo_contenido_id
      WHERE a.id = $1
      GROUP BY m.id, m.nombre, m.descripcion, c.id, c.anio, c.division,
               pcm.id, up.nombre, up.apellido
      ORDER BY m.nombre
    `, [alumnoId]);

    return result.rows;
  };

  getContenidosAsync = async (alumnoId, materiaId = null) => {
    const values = [alumnoId];
    let filtroMateria = '';

    if (materiaId) {
      values.push(materiaId);
      filtroMateria = 'AND m.id = $2';
    }

    const result = await pool.query(`
      SELECT
        con.id AS contenido_id,
        con.titulo,
        con.descripcion,
        con.archivo_url,
        con.fecha_creacion,
        tc.id AS tipo_contenido_id,
        tc.nombre AS tipo_contenido,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        c.id AS curso_id,
        c.anio,
        c.division
      FROM alumno a
      INNER JOIN curso c ON c.id = a.curso_id
      INNER JOIN curso_materia cm ON cm.curso_id = c.id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN profe_curso_materia pcm ON pcm.curso_materia_id = cm.id
      INNER JOIN contenido con ON con.profe_curso_materia_id = pcm.id
      INNER JOIN tipo_contenido tc ON tc.id = con.tipo_contenido_id
      WHERE a.id = $1
      ${filtroMateria}
      ORDER BY con.fecha_creacion DESC
    `, values);

    return result.rows;
  };
}