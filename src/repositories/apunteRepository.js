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

  /* Plantillas de estudio (Cornell, Feynman).

     Se agregan como columnas nuevas con IF NOT EXISTS en vez de crear una
     tabla aparte: un apunte con plantilla sigue siendo un apunte, y los que
     ya existen quedan como 'libre' sin tocar nada.

     Los campos propios de cada plantilla van en `secciones` (JSONB) porque
     son distintos en cada una — Cornell tiene palabras clave y resumen,
     Feynman tiene la explicación y las lagunas detectadas. Con columnas
     sueltas, cada plantilla nueva sumaría columnas que el resto deja en
     null. */
  await pool.query(`
    ALTER TABLE apunte
      ADD COLUMN IF NOT EXISTS plantilla VARCHAR(20) NOT NULL DEFAULT 'libre',
      ADD COLUMN IF NOT EXISTS secciones JSONB NOT NULL DEFAULT '{}'::jsonb
  `);

  tablaAsegurada = true;
}

/** Columnas que expone la API — una sola definición para las cuatro consultas. */
const CAMPOS = `id, titulo, contenido, color, plantilla, secciones,
                fecha_creacion, fecha_actualizacion`;

export default class ApunteRepository {
  getByAlumnoAsync = async (alumno_id) => {
    await ensureTable();
    const result = await pool.query(`
      SELECT ${CAMPOS}
      FROM apunte
      WHERE alumno_id = $1
      ORDER BY fecha_actualizacion DESC
    `, [alumno_id]);

    return result.rows;
  };

  createAsync = async (alumno_id, { titulo, contenido, color, plantilla, secciones }) => {
    await ensureTable();
    const result = await pool.query(`
      INSERT INTO apunte (alumno_id, titulo, contenido, color, plantilla, secciones)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING ${CAMPOS}
    `, [
      alumno_id,
      titulo,
      contenido || '',
      color || 'blanco',
      plantilla || 'libre',
      JSON.stringify(secciones ?? {})
    ]);

    return result.rows[0];
  };

  // El scope por alumno_id garantiza que cada alumno solo toque sus apuntes
  updateAsync = async (id, alumno_id, { titulo, contenido, color, plantilla, secciones }) => {
    await ensureTable();
    const result = await pool.query(`
      UPDATE apunte
      SET titulo = $1,
          contenido = $2,
          color = $3,
          plantilla = $4,
          secciones = $5::jsonb,
          fecha_actualizacion = NOW()
      WHERE id = $6 AND alumno_id = $7
      RETURNING ${CAMPOS}
    `, [
      titulo,
      contenido || '',
      color || 'blanco',
      plantilla || 'libre',
      JSON.stringify(secciones ?? {}),
      id,
      alumno_id
    ]);

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
