import pool from '../database/db.js';

/* Eventos del calendario institucional. La tabla se asegura al primer uso
   (CREATE TABLE IF NOT EXISTS) para no requerir migración manual. */

let tablaAsegurada = false;

async function ensureTable() {
  if (tablaAsegurada) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS evento_calendario (
      id SERIAL PRIMARY KEY,
      institucion_id BIGINT NOT NULL REFERENCES institucion(id),
      gestor_id BIGINT NOT NULL REFERENCES gestor(id),
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha DATE NOT NULL,
      tipo VARCHAR(20) NOT NULL DEFAULT 'evento',
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tablaAsegurada = true;
}

export default class EventoRepository {
  getByInstitucionAsync = async (institucion_id) => {
    await ensureTable();
    const result = await pool.query(`
      SELECT id, titulo, descripcion, to_char(fecha, 'YYYY-MM-DD') AS fecha, tipo
      FROM evento_calendario
      WHERE institucion_id = $1
      ORDER BY fecha ASC, id ASC
    `, [institucion_id]);

    return result.rows;
  };

  createAsync = async ({ institucion_id, gestor_id, titulo, descripcion, fecha, tipo }) => {
    await ensureTable();
    const result = await pool.query(`
      INSERT INTO evento_calendario (institucion_id, gestor_id, titulo, descripcion, fecha, tipo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, titulo, descripcion, to_char(fecha, 'YYYY-MM-DD') AS fecha, tipo
    `, [institucion_id, gestor_id, titulo, descripcion || null, fecha, tipo || 'evento']);

    return result.rows[0];
  };

  // Scope por institución: un gestor no puede borrar eventos ajenos
  deleteAsync = async (id, institucion_id) => {
    await ensureTable();
    const result = await pool.query(`
      DELETE FROM evento_calendario
      WHERE id = $1 AND institucion_id = $2
      RETURNING id
    `, [id, institucion_id]);

    return result.rows[0] ?? null;
  };
}
