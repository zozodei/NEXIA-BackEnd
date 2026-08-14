import pool from '../database/db.js';

/* ─────────────────────────────────────────────
   ZONA DE ESTUDIO — sesiones Pomodoro y objetivos.

   Las tablas se aseguran al primer uso, igual que
   en apunteRepository: el proyecto no tiene sistema
   de migraciones y así una instalación existente
   no necesita tocar la base a mano.

   Todo cuelga de alumno_id con ON DELETE CASCADE:
   son datos personales del alumno, no institucionales.
───────────────────────────────────────────── */

let tablasAseguradas = false;

async function ensureTables() {
  if (tablasAseguradas) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS estudio_sesion (
      id SERIAL PRIMARY KEY,
      alumno_id BIGINT NOT NULL REFERENCES alumno(id) ON DELETE CASCADE,
      -- Etiqueta libre de en qué se enfocó la sesión (materia, tema, TP…)
      foco TEXT NOT NULL DEFAULT '',
      ciclos_completados INTEGER NOT NULL DEFAULT 0,
      -- Se guardan los minutos efectivos de enfoque, no la duración total:
      -- lo que le sirve al alumno es cuánto estudió, no cuánto descansó.
      minutos_enfoque INTEGER NOT NULL DEFAULT 0,
      fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      fecha_fin TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS estudio_sesion_alumno_fecha_idx
    ON estudio_sesion (alumno_id, fecha_fin DESC)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS estudio_objetivo (
      id SERIAL PRIMARY KEY,
      alumno_id BIGINT NOT NULL REFERENCES alumno(id) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      completado BOOLEAN NOT NULL DEFAULT false,
      -- Pomodoros que el alumno estima que le va a llevar. Sirve para que
      -- planifique la sesión y no para medirlo: es una ayuda, no una métrica.
      pomodoros_estimados INTEGER NOT NULL DEFAULT 1,
      pomodoros_hechos INTEGER NOT NULL DEFAULT 0,
      orden INTEGER NOT NULL DEFAULT 0,
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      fecha_completado TIMESTAMPTZ
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS estudio_objetivo_alumno_idx
    ON estudio_objetivo (alumno_id, completado, orden)
  `);

  tablasAseguradas = true;
}

export default class EstudioRepository {
  // ── Sesiones ──────────────────────────────

  registrarSesionAsync = async (alumnoId, { foco, ciclos_completados, minutos_enfoque }) => {
    await ensureTables();
    const result = await pool.query(`
      INSERT INTO estudio_sesion (alumno_id, foco, ciclos_completados, minutos_enfoque)
      VALUES ($1, $2, $3, $4)
      RETURNING id, foco, ciclos_completados, minutos_enfoque, fecha_inicio, fecha_fin
    `, [alumnoId, foco || '', ciclos_completados || 0, minutos_enfoque || 0]);

    return result.rows[0];
  };

  /**
   * Resumen de estudio de los últimos `dias` días.
   *
   * Se devuelve una fila por día INCLUIDOS los días sin estudiar (generate_series
   * + LEFT JOIN). Si se devolvieran sólo los días con actividad, el gráfico del
   * frontend dibujaría barras contiguas y un alumno que estudió lunes y viernes
   * parecería haber estudiado dos días seguidos.
   */
  getResumenAsync = async (alumnoId, dias = 14) => {
    await ensureTables();
    const result = await pool.query(`
      SELECT
        d.dia::date AS dia,
        COALESCE(SUM(s.minutos_enfoque), 0)::int AS minutos,
        COALESCE(SUM(s.ciclos_completados), 0)::int AS ciclos,
        COUNT(s.id)::int AS sesiones
      FROM generate_series(
        (CURRENT_DATE - ($2::int - 1)),
        CURRENT_DATE,
        '1 day'
      ) AS d(dia)
      LEFT JOIN estudio_sesion s
        ON s.alumno_id = $1
       AND s.fecha_fin::date = d.dia::date
      GROUP BY d.dia
      ORDER BY d.dia
    `, [alumnoId, dias]);

    return result.rows;
  };

  getTotalesAsync = async (alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(minutos_enfoque), 0)::int AS minutos_total,
        COALESCE(SUM(ciclos_completados), 0)::int AS ciclos_total,
        COUNT(*)::int AS sesiones_total,
        COALESCE(SUM(minutos_enfoque) FILTER (WHERE fecha_fin::date = CURRENT_DATE), 0)::int AS minutos_hoy,
        COALESCE(SUM(ciclos_completados) FILTER (WHERE fecha_fin::date = CURRENT_DATE), 0)::int AS ciclos_hoy
      FROM estudio_sesion
      WHERE alumno_id = $1
    `, [alumnoId]);

    return result.rows[0];
  };

  /**
   * Días consecutivos estudiando hasta hoy (o hasta ayer).
   *
   * Se acepta que la racha termine ayer y no hoy: si sólo contara hasta hoy,
   * a las 00:01 el alumno vería su racha en cero antes de tener oportunidad
   * de estudiar, que es exactamente cuando el dato desmotiva.
   */
  getRachaAsync = async (alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      WITH dias AS (
        SELECT DISTINCT fecha_fin::date AS dia
        FROM estudio_sesion
        WHERE alumno_id = $1 AND minutos_enfoque > 0
      ),
      numerados AS (
        SELECT dia, dia - (ROW_NUMBER() OVER (ORDER BY dia))::int AS grupo
        FROM dias
      ),
      bloques AS (
        SELECT grupo, COUNT(*)::int AS largo, MAX(dia) AS ultimo
        FROM numerados
        GROUP BY grupo
      )
      SELECT COALESCE(MAX(largo), 0)::int AS racha
      FROM bloques
      WHERE ultimo >= CURRENT_DATE - 1
    `, [alumnoId]);

    return result.rows[0]?.racha ?? 0;
  };

  // ── Objetivos ─────────────────────────────

  getObjetivosAsync = async (alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      SELECT id, texto, completado, pomodoros_estimados, pomodoros_hechos, orden,
             fecha_creacion, fecha_completado
      FROM estudio_objetivo
      WHERE alumno_id = $1
      ORDER BY completado, orden, id
    `, [alumnoId]);

    return result.rows;
  };

  crearObjetivoAsync = async (alumnoId, { texto, pomodoros_estimados }) => {
    await ensureTables();
    const result = await pool.query(`
      INSERT INTO estudio_objetivo (alumno_id, texto, pomodoros_estimados, orden)
      VALUES (
        $1, $2, $3,
        -- Al final de la lista del alumno, sin pedir el orden al cliente.
        COALESCE((SELECT MAX(orden) + 1 FROM estudio_objetivo WHERE alumno_id = $1), 0)
      )
      RETURNING id, texto, completado, pomodoros_estimados, pomodoros_hechos, orden,
                fecha_creacion, fecha_completado
    `, [alumnoId, texto, Math.min(Math.max(Number(pomodoros_estimados) || 1, 1), 20)]);

    return result.rows[0];
  };

  actualizarObjetivoAsync = async (id, alumnoId, { texto, completado, pomodoros_estimados }) => {
    await ensureTables();
    // COALESCE por campo: el frontend manda sólo lo que cambió (marcar como
    // hecho no debería obligarlo a reenviar el texto y la estimación).
    const result = await pool.query(`
      UPDATE estudio_objetivo
      SET texto = COALESCE($1, texto),
          completado = COALESCE($2, completado),
          pomodoros_estimados = COALESCE($3, pomodoros_estimados),
          fecha_completado = CASE
            WHEN $2 IS TRUE  AND completado = false THEN NOW()
            WHEN $2 IS FALSE THEN NULL
            ELSE fecha_completado
          END
      WHERE id = $4 AND alumno_id = $5
      RETURNING id, texto, completado, pomodoros_estimados, pomodoros_hechos, orden,
                fecha_creacion, fecha_completado
    `, [
      texto ?? null,
      completado ?? null,
      pomodoros_estimados ?? null,
      id,
      alumnoId
    ]);

    return result.rows[0] ?? null;
  };

  /** Suma un pomodoro al objetivo en el que el alumno estuvo trabajando. */
  sumarPomodoroAsync = async (id, alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      UPDATE estudio_objetivo
      SET pomodoros_hechos = pomodoros_hechos + 1
      WHERE id = $1 AND alumno_id = $2
      RETURNING id, texto, completado, pomodoros_estimados, pomodoros_hechos, orden,
                fecha_creacion, fecha_completado
    `, [id, alumnoId]);

    return result.rows[0] ?? null;
  };

  eliminarObjetivoAsync = async (id, alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      DELETE FROM estudio_objetivo
      WHERE id = $1 AND alumno_id = $2
      RETURNING id
    `, [id, alumnoId]);

    return result.rows[0] ?? null;
  };

  eliminarCompletadosAsync = async (alumnoId) => {
    await ensureTables();
    const result = await pool.query(`
      DELETE FROM estudio_objetivo
      WHERE alumno_id = $1 AND completado = true
      RETURNING id
    `, [alumnoId]);

    return result.rowCount;
  };
}
