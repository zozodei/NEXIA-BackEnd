import pool from '../database/db.js';

/* ─────────────────────────────────────────────
   Destinatarios de notificaciones por email.
   Todas las consultas ya filtran por la preferencia
   notificaciones_email = true y por email presente,
   de modo que el service sólo se ocupa de enviar.
───────────────────────────────────────────── */

const FILTRO_NOTIFICABLE = `
  u.notificaciones_email = true
  AND u.email IS NOT NULL
  AND u.email <> ''
`;

export default class NotificacionRepository {
  // Un alumno concreto (por su id de alumno)
  getAlumnoDestinatarioAsync = async (alumnoId) => {
    const result = await pool.query(
      `SELECT u.email, u.nombre, u.apellido, u.notificaciones_email
         FROM alumno a
         INNER JOIN usuario u ON u.id = a.usuario_id
        WHERE a.id = $1
          AND ${FILTRO_NOTIFICABLE}`,
      [alumnoId]
    );
    return result.rows[0] || null;
  };

  // Todos los alumnos activos de un curso (para "nuevo TP publicado")
  getAlumnosDeCursoAsync = async (cursoId) => {
    const result = await pool.query(
      `SELECT u.email, u.nombre, u.apellido
         FROM alumno a
         INNER JOIN usuario u ON u.id = a.usuario_id
        WHERE a.curso_id = $1
          AND u.activo = true
          AND ${FILTRO_NOTIFICABLE}`,
      [cursoId]
    );
    return result.rows;
  };

  // Todos los usuarios activos de una institución (para comunicados)
  getUsuariosDeInstitucionAsync = async (institucionId) => {
    const result = await pool.query(
      `SELECT u.email, u.nombre, u.apellido
         FROM usuario u
        WHERE u.institucion_id = $1
          AND u.activo = true
          AND ${FILTRO_NOTIFICABLE}`,
      [institucionId]
    );
    return result.rows;
  };
}
