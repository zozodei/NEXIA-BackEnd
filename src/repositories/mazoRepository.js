import pool from '../database/db.js';

/* ─────────────────────────────────────────────
   FLASHCARDS CON REPETICIÓN ESPACIADA.

   Flashcards, recuperación activa y repetición
   espaciada no son tres herramientas: son la misma.
   Una tarjeta que se muestra sin la respuesta ES
   recuperación activa, y una agenda que espacia
   los repasos ES repetición espaciada. Por eso hay
   un solo modelo y no tres.

   La agenda usa SM-2 (SuperMemo 2), el algoritmo
   detrás de Anki: cada tarjeta guarda su propio
   factor de facilidad e intervalo, así las que
   cuestan vuelven pronto y las sabidas se espacian.
───────────────────────────────────────────── */

let tablasAseguradas = false;

async function ensureTables() {
  if (tablasAseguradas) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mazo (
      id SERIAL PRIMARY KEY,
      alumno_id BIGINT NOT NULL REFERENCES alumno(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL DEFAULT '',
      color VARCHAR(20) NOT NULL DEFAULT 'navy',
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarjeta (
      id SERIAL PRIMARY KEY,
      mazo_id INTEGER NOT NULL REFERENCES mazo(id) ON DELETE CASCADE,
      frente TEXT NOT NULL,
      reverso TEXT NOT NULL,

      -- Estado SM-2 de esta tarjeta en particular
      repeticiones INTEGER NOT NULL DEFAULT 0,
      factor_facilidad NUMERIC(4,2) NOT NULL DEFAULT 2.5,
      intervalo_dias INTEGER NOT NULL DEFAULT 0,
      -- Nace vencida: una tarjeta recién creada entra al repaso de hoy.
      proximo_repaso DATE NOT NULL DEFAULT CURRENT_DATE,

      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ultimo_repaso TIMESTAMPTZ
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS tarjeta_mazo_repaso_idx
    ON tarjeta (mazo_id, proximo_repaso)
  `);

  tablasAseguradas = true;
}

export default class MazoRepository {
  // ── Mazos ─────────────────────────────────

  getMazosAsync = async (alumnoId) => {
    await ensureTables();
    // Los contadores van como subconsultas para no multiplicar filas, y
    // "pendientes" es lo que el alumno necesita ver: cuántas tocan hoy.
    const result = await pool.query(`
      SELECT
        m.id,
        m.nombre,
        m.descripcion,
        m.color,
        m.fecha_creacion,
        (SELECT COUNT(*)::int FROM tarjeta t WHERE t.mazo_id = m.id) AS total_tarjetas,
        (SELECT COUNT(*)::int FROM tarjeta t
          WHERE t.mazo_id = m.id AND t.proximo_repaso <= CURRENT_DATE) AS pendientes,
        (SELECT COUNT(*)::int FROM tarjeta t
          WHERE t.mazo_id = m.id AND t.repeticiones = 0) AS sin_estudiar
      FROM mazo m
      WHERE m.alumno_id = $1
      ORDER BY m.fecha_creacion DESC
    `, [alumnoId]);

    return result.rows;
  };

  getMazoAsync = async (id, alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      SELECT id, nombre, descripcion, color, fecha_creacion
      FROM mazo
      WHERE id = $1 AND alumno_id = $2
    `, [id, alumnoId]);

    return result.rows[0] ?? null;
  };

  crearMazoAsync = async (alumnoId, { nombre, descripcion, color }) => {
    await ensureTables();
    const result = await pool.query(`
      INSERT INTO mazo (alumno_id, nombre, descripcion, color)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, descripcion, color, fecha_creacion,
                0 AS total_tarjetas, 0 AS pendientes, 0 AS sin_estudiar
    `, [alumnoId, nombre, descripcion || '', color || 'navy']);

    return result.rows[0];
  };

  actualizarMazoAsync = async (id, alumnoId, { nombre, descripcion, color }) => {
    await ensureTables();
    const result = await pool.query(`
      UPDATE mazo
      SET nombre = $1, descripcion = $2, color = $3
      WHERE id = $4 AND alumno_id = $5
      RETURNING id, nombre, descripcion, color, fecha_creacion
    `, [nombre, descripcion || '', color || 'navy', id, alumnoId]);

    return result.rows[0] ?? null;
  };

  eliminarMazoAsync = async (id, alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      DELETE FROM mazo WHERE id = $1 AND alumno_id = $2 RETURNING id
    `, [id, alumnoId]);

    return result.rows[0] ?? null;
  };

  // ── Tarjetas ──────────────────────────────

  getTarjetasAsync = async (mazoId, alumnoId) => {
    await ensureTables();
    // El INNER JOIN con mazo es el que garantiza la pertenencia: sin él,
    // cualquier alumno podría leer las tarjetas de otro pasando un mazo_id.
    const result = await pool.query(`
      SELECT t.id, t.frente, t.reverso, t.repeticiones, t.factor_facilidad,
             t.intervalo_dias, t.proximo_repaso, t.ultimo_repaso, t.fecha_creacion
      FROM tarjeta t
      INNER JOIN mazo m ON m.id = t.mazo_id
      WHERE t.mazo_id = $1 AND m.alumno_id = $2
      ORDER BY t.id
    `, [mazoId, alumnoId]);

    return result.rows;
  };

  crearTarjetaAsync = async (mazoId, alumnoId, { frente, reverso }) => {
    await ensureTables();
    const result = await pool.query(`
      INSERT INTO tarjeta (mazo_id, frente, reverso)
      SELECT $1, $2, $3
      WHERE EXISTS (SELECT 1 FROM mazo WHERE id = $1 AND alumno_id = $4)
      RETURNING id, frente, reverso, repeticiones, factor_facilidad,
                intervalo_dias, proximo_repaso, ultimo_repaso, fecha_creacion
    `, [mazoId, frente, reverso, alumnoId]);

    return result.rows[0] ?? null;
  };

  /** Una tarjeta con su estado SM-2, verificando que sea del alumno. */
  getTarjetaAsync = async (id, alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      SELECT t.id, t.frente, t.reverso, t.repeticiones, t.factor_facilidad,
             t.intervalo_dias, t.proximo_repaso, t.mazo_id
      FROM tarjeta t
      INNER JOIN mazo m ON m.id = t.mazo_id
      WHERE t.id = $1 AND m.alumno_id = $2
    `, [id, alumnoId]);

    return result.rows[0] ?? null;
  };

  actualizarTarjetaAsync = async (id, alumnoId, { frente, reverso }) => {
    await ensureTables();
    const result = await pool.query(`
      UPDATE tarjeta t
      SET frente = $1, reverso = $2
      FROM mazo m
      WHERE t.id = $3 AND m.id = t.mazo_id AND m.alumno_id = $4
      RETURNING t.id, t.frente, t.reverso, t.repeticiones, t.factor_facilidad,
                t.intervalo_dias, t.proximo_repaso, t.ultimo_repaso, t.fecha_creacion
    `, [frente, reverso, id, alumnoId]);

    return result.rows[0] ?? null;
  };

  eliminarTarjetaAsync = async (id, alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      DELETE FROM tarjeta t
      USING mazo m
      WHERE t.id = $1 AND m.id = t.mazo_id AND m.alumno_id = $2
      RETURNING t.id
    `, [id, alumnoId]);

    return result.rows[0] ?? null;
  };

  // ── Repaso ────────────────────────────────

  /**
   * Tarjetas que tocan hoy. Si `mazoId` es null, junta las de todos los mazos
   * (el repaso diario del alumno atraviesa materias, como en la vida real).
   */
  getPendientesAsync = async (alumnoId, mazoId = null, limite = 40) => {
    await ensureTables();
    const values = [alumnoId, limite];
    let filtro = '';

    if (mazoId) {
      values.push(mazoId);
      filtro = 'AND m.id = $3';
    }

    const result = await pool.query(`
      SELECT t.id, t.frente, t.reverso, t.repeticiones, t.factor_facilidad,
             t.intervalo_dias, t.proximo_repaso,
             m.id AS mazo_id, m.nombre AS mazo_nombre, m.color AS mazo_color
      FROM tarjeta t
      INNER JOIN mazo m ON m.id = t.mazo_id
      WHERE m.alumno_id = $1
        AND t.proximo_repaso <= CURRENT_DATE
        ${filtro}
      -- Las más atrasadas primero; entre iguales, las nuevas antes.
      ORDER BY t.proximo_repaso ASC, t.repeticiones ASC, t.id ASC
      LIMIT $2
    `, values);

    return result.rows;
  };

  /** Persiste el nuevo estado SM-2 calculado por el service. */
  guardarRepasoAsync = async (id, alumnoId, { repeticiones, factor_facilidad, intervalo_dias }) => {
    await ensureTables();
    const result = await pool.query(`
      UPDATE tarjeta t
      SET repeticiones = $1,
          factor_facilidad = $2,
          intervalo_dias = $3,
          proximo_repaso = CURRENT_DATE + $3::int,
          ultimo_repaso = NOW()
      FROM mazo m
      WHERE t.id = $4 AND m.id = t.mazo_id AND m.alumno_id = $5
      RETURNING t.id, t.repeticiones, t.factor_facilidad, t.intervalo_dias, t.proximo_repaso
    `, [repeticiones, factor_facilidad, intervalo_dias, id, alumnoId]);

    return result.rows[0] ?? null;
  };

  /** Cuántas tarjetas tocan hoy en total — para el resumen del hub. */
  contarPendientesAsync = async (alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      SELECT COUNT(*)::int AS pendientes
      FROM tarjeta t
      INNER JOIN mazo m ON m.id = t.mazo_id
      WHERE m.alumno_id = $1 AND t.proximo_repaso <= CURRENT_DATE
    `, [alumnoId]);

    return result.rows[0]?.pendientes ?? 0;
  };
}
