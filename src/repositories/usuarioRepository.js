import pool from '../database/db.js';

// Campos de perfil que el propio usuario puede editar desde "Configuración".
// rol, activo, dni e institución quedan deliberadamente fuera (los gestiona
// la administración, no el usuario).
const CAMPOS_EDITABLES = [
  'nombre',
  'apellido',
  'email',
  'foto_perfil_url',
  'tema',
  'idioma',
  'notificaciones_email',
];

// Columnas del perfil que se devuelven al frontend (nunca la password).
const SELECT_PERFIL = `
  id AS usuario_id,
  institucion_id,
  nombre,
  apellido,
  email,
  dni,
  UPPER(rol) AS rol,
  foto_perfil_url,
  tema,
  idioma,
  notificaciones_email,
  fecha_actualizacion,
  fecha_creacion
`;

export default class UsuarioRepository {
  getPerfilByIdAsync = async (usuarioId) => {
    const result = await pool.query(
      `SELECT ${SELECT_PERFIL} FROM usuario WHERE id = $1`,
      [usuarioId]
    );
    return result.rows[0] ?? null;
  };

  // UPDATE dinámico: sólo toca las columnas presentes en `campos` y siempre
  // refresca fecha_actualizacion. Devuelve el perfil ya actualizado.
  updatePerfilAsync = async (usuarioId, campos) => {
    const entradas = Object.entries(campos)
      .filter(([clave, valor]) => CAMPOS_EDITABLES.includes(clave) && valor !== undefined);

    if (entradas.length === 0) {
      return this.getPerfilByIdAsync(usuarioId);
    }

    const set = entradas.map(([clave], i) => `${clave} = $${i + 1}`);
    const valores = entradas.map(([, valor]) => valor);
    set.push('fecha_actualizacion = CURRENT_TIMESTAMP');

    const result = await pool.query(
      `UPDATE usuario
          SET ${set.join(', ')}
        WHERE id = $${valores.length + 1}
      RETURNING ${SELECT_PERFIL}`,
      [...valores, usuarioId]
    );
    return result.rows[0] ?? null;
  };

  getPasswordHashAsync = async (usuarioId) => {
    const result = await pool.query(
      'SELECT password FROM usuario WHERE id = $1',
      [usuarioId]
    );
    return result.rows[0]?.password ?? null;
  };

  updatePasswordAsync = async (usuarioId, passwordHash) => {
    await pool.query(
      `UPDATE usuario
          SET password = $1, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [passwordHash, usuarioId]
    );
  };
}
