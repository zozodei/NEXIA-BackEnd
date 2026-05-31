import pool from '../database/db.js';

export default class ProfesorRepository {
  getAllAsync = async (institucionId = null) => {
    const values = [];
    let filtro = '';

    if (institucionId) {
      values.push(institucionId);
      filtro = 'WHERE u.institucion_id = $1';
    }

    const result = await pool.query(`
      SELECT
        p.id AS profesor_id,
        u.id AS usuario_id,
        u.institucion_id,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.activo
      FROM profesor p
      INNER JOIN usuario u ON u.id = p.usuario_id
      ${filtro}
      ORDER BY u.apellido, u.nombre
    `, values);

    return result.rows;
  };

  getByIdAsync = async (profesorId) => {
    const result = await pool.query(`
      SELECT
        p.id AS profesor_id,
        u.id AS usuario_id,
        u.institucion_id,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.activo
      FROM profesor p
      INNER JOIN usuario u ON u.id = p.usuario_id
      WHERE p.id = $1
    `, [profesorId]);

    return result.rows[0] || null;
  };

  getMateriasAsync = async (profesorId) => {
    const result = await pool.query(`
      SELECT
        pcm.id AS profe_curso_materia_id,
        p.id AS profesor_id,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        m.descripcion AS materia_descripcion,
        c.id AS curso_id,
        c.anio,
        c.division,
        e.id AS especialidad_id,
        e.nombre AS especialidad_nombre
      FROM profesor p
      INNER JOIN profe_curso_materia pcm ON pcm.profesor_id = p.id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      LEFT JOIN especialidad e ON e.id = c.especialidad_id
      WHERE p.id = $1
      ORDER BY c.anio, c.division, m.nombre
    `, [profesorId]);

    return result.rows;
  };
}