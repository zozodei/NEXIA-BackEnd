import pool from '../database/db.js';

export default class AuthRepository {
  loginUsuarioAsync = async ({ institucion_id, dni, password, rol }) => {
    const result = await pool.query(`
      SELECT
        u.id AS usuario_id,
        u.institucion_id,
        i.nombre AS institucion_nombre,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.activo,
        a.id AS alumno_id,
        p.id AS profesor_id,
        a.curso_id
      FROM usuario u
      INNER JOIN institucion i ON i.id = u.institucion_id
      LEFT JOIN alumno a ON a.usuario_id = u.id
      LEFT JOIN profesor p ON p.usuario_id = u.id
      WHERE u.institucion_id = $1
        AND u.dni = $2
        AND u.password = $3
        AND u.rol = $4
        AND u.activo = true
      LIMIT 1
    `, [institucion_id, dni, password, rol]);

    return result.rows[0] || null;
  };

  loginGestorAsync = async ({ institucion_id, dni, password }) => {
    const result = await pool.query(`
      SELECT
        g.id AS gestor_id,
        g.nombre,
        g.dni,
        i.id AS institucion_id,
        i.nombre AS institucion_nombre
      FROM gestor g
      INNER JOIN institucion i ON i.gestor_id = g.id
      WHERE i.id = $1
        AND g.dni = $2
        AND g.password = $3
      LIMIT 1
    `, [institucion_id, dni, password]);

    return result.rows[0] || null;
  };
}