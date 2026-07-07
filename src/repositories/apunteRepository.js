import pool from '../database/db.js';

/* Apuntes personales del alumno. La tabla se asegura al primer uso
   (CREATE TABLE IF NOT EXISTS) para no requerir migración manual. */

let tablaAsegurada = false;

async function ensureTable() {
  if (tablaAsegurada) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS apunte (
      id SERIAL PRIMARY KEY,
      alumno_id INTEGER NOT NULL REFERENCES alumno(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      contenido TEXT NOT NULL DEFAULT '',
      color VARCHAR(20) NOT NULL DEFAULT 'blanco',
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tablaAsegurada = true;
}

export default class ApunteRepository {
  getByAlumnoAsync = async (alumno_id) => {
    await ensureTable();
    const result = await pool.query(`
      SELECT id, titulo, contenido, color, fecha_creacion, fecha_actualizacion
      FROM apunte
      WHERE alumno_id = $1
      ORDER BY fecha_actualizacion DESC
    `, [alumno_id]);

    return result.rows;
  };

  createAsync = async (alumno_id, { titulo, contenido, color }) => {
    await ensureTable();
    const result = await pool.query(`
      INSERT INTO apunte (alumno_id, titulo, contenido, color)
      VALUES ($1, $2, $3, $4)
      RETURNING id, titulo, contenido, color, fecha_creacion, fecha_actualizacion
    `, [alumno_id, titulo, contenido || '', color || 'blanco']);

    return result.rows[0];
  };

  // El scope por alumno_id garantiza que cada alumno solo toque sus apuntes
  updateAsync = async (id, alumno_id, { titulo, contenido, color }) => {
    await ensureTable();
    const result = await pool.query(`
      UPDATE apunte
      SET titulo = $1,
          contenido = $2,
          color = $3,
          fecha_actualizacion = NOW()
      WHERE id = $4 AND alumno_id = $5
      RETURNING id, titulo, contenido, color, fecha_creacion, fecha_actualizacion
    `, [titulo, contenido || '', color || 'blanco', id, alumno_id]);

    return result.rows[0] ?? null;
  };

  deleteAsync = async (id, alumno_id) => {
    await ensureTable();
    const result = await pool.query(`
      DELETE FROM apunte
      WHERE id = $1 AND alumno_id = $2
      RETURNING id
    `, [id, alumno_id]);

    return result.rows[0] ?? null;
  };
}
