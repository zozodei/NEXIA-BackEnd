import pool from '../database/db.js';

// Campos de datos personales editables desde PUT /me. id, institucion_id,
// rol, dni, email, password, activo, fecha_creacion, foto_perfil_url y
// avatar_config quedan fuera: los primeros los gestiona la administración,
// los últimos dos tienen sus propios endpoints (avatar/foto/imagen).
const CAMPOS_DATOS = [
  'nombre',
  'apellido',
  'telefono',
  'fecha_nacimiento',
  'biografia',
  'genero',
  'direccion',
  'ciudad',
  'pais',
  'tema',
  'idioma',
  'notificaciones_email',
];

// Nunca se selecciona password.
const SELECT_PERFIL = `
  id AS usuario_id,
  institucion_id,
  nombre,
  apellido,
  email,
  dni,
  UPPER(rol) AS rol,
  activo,
  foto_perfil_url,
  avatar_config,
  telefono,
  fecha_nacimiento,
  biografia,
  genero,
  direccion,
  ciudad,
  pais,
  tema,
  idioma,
  notificaciones_email,
  fecha_creacion,
  fecha_actualizacion
`;

export default class PerfilRepository {
  getByIdAsync = async (usuarioId) => {
    const result = await pool.query(
      `SELECT ${SELECT_PERFIL} FROM usuario WHERE id = $1`,
      [usuarioId]
    );
    return result.rows[0] ?? null;
  };

  // Estado actual de la imagen, para saber qué borrar del storage antes de
  // pisarlo con una foto/avatar nuevo.
  getImagenActualAsync = async (usuarioId) => {
    const result = await pool.query(
      'SELECT foto_perfil_url, avatar_config FROM usuario WHERE id = $1',
      [usuarioId]
    );
    return result.rows[0] ?? null;
  };

  // UPDATE dinámico: sólo toca las columnas presentes en `campos`.
  updateDatosAsync = async (usuarioId, campos) => {
    const entradas = Object.entries(campos)
      .filter(([clave, valor]) => CAMPOS_DATOS.includes(clave) && valor !== undefined);

    if (entradas.length === 0) {
      return this.getByIdAsync(usuarioId);
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

  // avatar_config y foto_perfil_url son mutuamente excluyentes (CHECK en BD):
  // cada setter limpia el otro campo en la misma sentencia.
  setAvatarConfigAsync = async (usuarioId, avatarConfig) => {
    const result = await pool.query(
      `UPDATE usuario
          SET avatar_config = $1::jsonb,
              foto_perfil_url = NULL,
              fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $2
      RETURNING ${SELECT_PERFIL}`,
      [JSON.stringify(avatarConfig), usuarioId]
    );
    return result.rows[0] ?? null;
  };

  setFotoUrlAsync = async (usuarioId, url) => {
    const result = await pool.query(
      `UPDATE usuario
          SET foto_perfil_url = $1,
              avatar_config = NULL,
              fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $2
      RETURNING ${SELECT_PERFIL}`,
      [url, usuarioId]
    );
    return result.rows[0] ?? null;
  };

  limpiarImagenAsync = async (usuarioId) => {
    const result = await pool.query(
      `UPDATE usuario
          SET foto_perfil_url = NULL,
              avatar_config = NULL,
              fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1
      RETURNING ${SELECT_PERFIL}`,
      [usuarioId]
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
