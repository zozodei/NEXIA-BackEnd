import pool from '../database/db.js';

export default class ContenidoRepository {
  getAllAsync = async () => {
    const result = await pool.query(`
      SELECT
        con.id AS contenido_id,
        con.titulo,
        con.descripcion,
        con.archivo_url,
        con.fecha_creacion,
        tc.id AS tipo_contenido_id,
        tc.nombre AS tipo_contenido,
        pcm.id AS profe_curso_materia_id,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        c.id AS curso_id,
        c.anio,
        c.division,
        p.id AS profesor_id,
        u.nombre AS profesor_nombre,
        u.apellido AS profesor_apellido
      FROM contenido con
      INNER JOIN tipo_contenido tc ON tc.id = con.tipo_contenido_id
      INNER JOIN profe_curso_materia pcm ON pcm.id = con.profe_curso_materia_id
      INNER JOIN profesor p ON p.id = pcm.profesor_id
      INNER JOIN usuario u ON u.id = p.usuario_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      ORDER BY con.fecha_creacion DESC
    `);

    return result.rows;
  };

  createAsync = async ({
    profe_curso_materia_id,
    tipo_contenido_id,
    titulo,
    descripcion,
    archivo_url
  }) => {
    const result = await pool.query(`
      INSERT INTO contenido (
        profe_curso_materia_id,
        tipo_contenido_id,
        titulo,
        descripcion,
        archivo_url
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      profe_curso_materia_id,
      tipo_contenido_id,
      titulo,
      descripcion || null,
      archivo_url
    ]);

    return result.rows[0];
  };

  updateAsync = async (id, { titulo, descripcion, archivo_url, tipo_contenido_id }) => {
    const result = await pool.query(`
      UPDATE contenido
      SET
        titulo = COALESCE($2, titulo),
        descripcion = COALESCE($3, descripcion),
        archivo_url = COALESCE($4, archivo_url),
        tipo_contenido_id = COALESCE($5, tipo_contenido_id)
      WHERE id = $1
      RETURNING *
    `, [
      id,
      titulo || null,
      descripcion || null,
      archivo_url || null,
      tipo_contenido_id || null
    ]);

    return result.rows[0] || null;
  };

  getByProfesorAsync = async (profesorId) => {
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
        c.division,
        pcm.id AS profe_curso_materia_id
      FROM contenido con
      INNER JOIN tipo_contenido tc ON tc.id = con.tipo_contenido_id
      INNER JOIN profe_curso_materia pcm ON pcm.id = con.profe_curso_materia_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      WHERE pcm.profesor_id = $1
      ORDER BY con.fecha_creacion DESC
    `, [profesorId]);

    return result.rows;
  };

  getByProfeCursoMateriaAsync = async (profeCursoMateriaId) => {
    const result = await pool.query(`
      SELECT
        con.id AS contenido_id,
        con.titulo,
        con.descripcion,
        con.archivo_url,
        con.fecha_creacion,

        tc.id AS tipo_contenido_id,
        tc.nombre AS tipo_contenido,

        pcm.id AS profe_curso_materia_id,

        p.id AS profesor_id,
        u.nombre AS profesor_nombre,
        u.apellido AS profesor_apellido,

        m.id AS materia_id,
        m.nombre AS materia_nombre,
        m.descripcion AS materia_descripcion,

        c.id AS curso_id,
        c.anio,
        c.division

      FROM contenido con
      INNER JOIN tipo_contenido tc ON tc.id = con.tipo_contenido_id
      INNER JOIN profe_curso_materia pcm ON pcm.id = con.profe_curso_materia_id
      INNER JOIN profesor p ON p.id = pcm.profesor_id
      INNER JOIN usuario u ON u.id = p.usuario_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id

      WHERE pcm.id = $1

      ORDER BY con.fecha_creacion DESC
    `, [profeCursoMateriaId]);

    return result.rows;
  };

  getDetalleProfeCursoMateriaAsync = async (profeCursoMateriaId) => {
    const result = await pool.query(`
      SELECT
        pcm.id AS profe_curso_materia_id,

        p.id AS profesor_id,
        u.nombre AS profesor_nombre,
        u.apellido AS profesor_apellido,

        m.id AS materia_id,
        m.nombre AS materia_nombre,
        m.descripcion AS materia_descripcion,

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

  getByIdAsync = async (contenidoId) => {
    const result = await pool.query(`
      SELECT
        con.id AS contenido_id,
        con.titulo,
        con.descripcion,
        con.archivo_url,
        con.fecha_creacion,
        tc.id AS tipo_contenido_id,
        tc.nombre AS tipo_contenido,
        pcm.id AS profe_curso_materia_id,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        c.id AS curso_id,
        c.anio,
        c.division,
        p.id AS profesor_id,
        u.nombre AS profesor_nombre,
        u.apellido AS profesor_apellido
      FROM contenido con
      INNER JOIN tipo_contenido tc ON tc.id = con.tipo_contenido_id
      INNER JOIN profe_curso_materia pcm ON pcm.id = con.profe_curso_materia_id
      INNER JOIN profesor p ON p.id = pcm.profesor_id
      INNER JOIN usuario u ON u.id = p.usuario_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      WHERE con.id = $1
    `, [contenidoId]);

    return result.rows[0] || null;
  };
}