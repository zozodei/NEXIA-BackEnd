import pool from '../database/db.js';

/* ─────────────────────────────────────────────
   MAPAS CONCEPTUALES.

   El grafo (nodos y conexiones) se guarda entero
   como JSONB en una sola columna, no en tablas
   nodo/arista normalizadas.

   Es deliberado: el mapa se lee y se escribe
   siempre completo — nadie pide "el nodo 7 de este
   mapa" — y normalizarlo obligaría a un DELETE +
   INSERT masivo en cada guardado del canvas, con
   transacción, para no ganar ninguna consulta.
───────────────────────────────────────────── */

let tablaAsegurada = false;

async function ensureTable() {
  if (tablaAsegurada) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mapa_conceptual (
      id SERIAL PRIMARY KEY,
      alumno_id BIGINT NOT NULL REFERENCES alumno(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      -- { nodos: [{id,texto,x,y,tipo}], conexiones: [{de,a,etiqueta}] }
      datos JSONB NOT NULL DEFAULT '{"nodos":[],"conexiones":[]}'::jsonb,
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS mapa_alumno_idx
    ON mapa_conceptual (alumno_id, fecha_actualizacion DESC)
  `);

  tablaAsegurada = true;
}

export default class MapaRepository {
  /**
   * Listado sin el grafo.
   *
   * Se devuelve sólo el conteo de nodos y no la columna datos: un mapa grande
   * son decenas de KB de JSON y la pantalla de listado sólo muestra el título.
   */
  getTodosAsync = async (alumnoId) => {
    await ensureTable();
    const result = await pool.query(`
      SELECT
        id,
        titulo,
        fecha_creacion,
        fecha_actualizacion,
        COALESCE(jsonb_array_length(datos -> 'nodos'), 0) AS cantidad_nodos
      FROM mapa_conceptual
      WHERE alumno_id = $1
      ORDER BY fecha_actualizacion DESC
    `, [alumnoId]);

    return result.rows;
  };

  getPorIdAsync = async (id, alumnoId) => {
    await ensureTable();
    const result = await pool.query(`
      SELECT id, titulo, datos, fecha_creacion, fecha_actualizacion
      FROM mapa_conceptual
      WHERE id = $1 AND alumno_id = $2
    `, [id, alumnoId]);

    return result.rows[0] ?? null;
  };

  crearAsync = async (alumnoId, { titulo, datos }) => {
    await ensureTable();
    const result = await pool.query(`
      INSERT INTO mapa_conceptual (alumno_id, titulo, datos)
      VALUES ($1, $2, $3::jsonb)
      RETURNING id, titulo, datos, fecha_creacion, fecha_actualizacion
    `, [alumnoId, titulo, JSON.stringify(datos ?? { nodos: [], conexiones: [] })]);

    return result.rows[0];
  };

  actualizarAsync = async (id, alumnoId, { titulo, datos }) => {
    await ensureTable();
    const result = await pool.query(`
      UPDATE mapa_conceptual
      SET titulo = COALESCE($1, titulo),
          datos = COALESCE($2::jsonb, datos),
          fecha_actualizacion = NOW()
      WHERE id = $3 AND alumno_id = $4
      RETURNING id, titulo, datos, fecha_creacion, fecha_actualizacion
    `, [titulo ?? null, datos ? JSON.stringify(datos) : null, id, alumnoId]);

    return result.rows[0] ?? null;
  };

  eliminarAsync = async (id, alumnoId) => {
    await ensureTable();
    const result = await pool.query(`
      DELETE FROM mapa_conceptual
      WHERE id = $1 AND alumno_id = $2
      RETURNING id
    `, [id, alumnoId]);

    return result.rows[0] ?? null;
  };

  contarAsync = async (alumnoId) => {
    await ensureTable();
    const result = await pool.query(`
      SELECT COUNT(*)::int AS total FROM mapa_conceptual WHERE alumno_id = $1
    `, [alumnoId]);

    return result.rows[0]?.total ?? 0;
  };
}
