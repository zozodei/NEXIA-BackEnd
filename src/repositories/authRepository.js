import pool from '../database/db.js';

export default class AuthRepository {
  // La institución se deriva del DNI: se buscan todos los candidatos activos
  // con ese DNI (puede haber más de uno si el mismo DNI existe en distintas
  // instituciones). El authService desambigua comparando la contraseña.
  loginUsuarioAsync = async ({ dni }) => {
    const result = await pool.query(`
      SELECT
        u.id AS usuario_id,
        u.institucion_id,
        i.nombre AS institucion_nombre,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        UPPER(u.rol) AS rol,
        u.activo,
        u.password,

        a.id AS alumno_id,
        a.curso_id,

        p.id AS profesor_id,

        co.id AS coordinador_id,
        co.especialidad_id,

        NULL::bigint AS gestor_id,
        NULL::bigint AS director_id

      FROM usuario u
      INNER JOIN institucion i ON i.id = u.institucion_id

      LEFT JOIN alumno a ON a.usuario_id = u.id
      LEFT JOIN profesor p ON p.usuario_id = u.id
      LEFT JOIN coordinador co ON co.usuario_id = u.id

      WHERE u.dni = $1
        AND u.activo = true
    `, [String(dni)]);

    return result.rows;
  };

  loginGestorAsync = async ({ dni }) => {
    const result = await pool.query(`
      SELECT
        NULL::bigint AS usuario_id,
        i.id AS institucion_id,
        i.nombre AS institucion_nombre,

        g.nombre,
        NULL::varchar AS apellido,
        NULL::varchar AS email,
        g.dni,
        'GESTOR' AS rol,
        true AS activo,
        g.password,

        NULL::bigint AS alumno_id,
        NULL::bigint AS curso_id,

        NULL::bigint AS profesor_id,

        NULL::bigint AS coordinador_id,
        NULL::bigint AS especialidad_id,

        g.id AS gestor_id,
        NULL::bigint AS director_id

      FROM gestor g
      INNER JOIN institucion i ON i.gestor_id = g.id

      WHERE g.dni = $1
    `, [String(dni)]);

    return result.rows;
  };

  loginDirectorAsync = async ({ dni }) => {
    const result = await pool.query(`
      SELECT
        NULL::bigint AS usuario_id,
        i.id AS institucion_id,
        i.nombre AS institucion_nombre,

        d.nombre,
        d.apellido,
        NULL::varchar AS email,
        d.dni::varchar AS dni,
        'DIRECTIVO' AS rol,
        true AS activo,
        d.password,

        NULL::bigint AS alumno_id,
        NULL::bigint AS curso_id,

        NULL::bigint AS profesor_id,

        NULL::bigint AS coordinador_id,
        NULL::bigint AS especialidad_id,

        NULL::bigint AS gestor_id,
        d.id AS director_id

      FROM director d
      INNER JOIN institucion i ON i.director_id = d.id

      WHERE d.dni = $1
    `, [Number(dni)]);

    return result.rows;
  };
}
