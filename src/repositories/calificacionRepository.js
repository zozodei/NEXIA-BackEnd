import pool from '../database/db.js';

/* La tabla calificacion necesita unicidad por (alumno_id, curso_materia_id, bimestre_id)
   para que el upsert con ON CONFLICT funcione — el esquema original no la tenía
   y cargar una nota fallaba con error 500 (42P10). Se asegura al primer uso:
   1) elimina duplicados históricos (conserva la calificación más reciente)
   2) crea el índice único si no existe. */

let indiceAsegurado = false;

async function ensureIndiceUnico() {
  if (indiceAsegurado) return;

  await pool.query(`
    DELETE FROM calificacion c
    USING calificacion dup
    WHERE c.alumno_id = dup.alumno_id
      AND c.curso_materia_id = dup.curso_materia_id
      AND c.bimestre_id = dup.bimestre_id
      AND c.id < dup.id
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS calificacion_alumno_cm_bimestre_unique
    ON calificacion (alumno_id, curso_materia_id, bimestre_id)
  `);

  indiceAsegurado = true;
}

export default class CalificacionRepository {
  getDetallePcmAsync = async (profeCursoMateriaId) => {
    const result = await pool.query(`
      SELECT
        pcm.id AS profe_curso_materia_id,
        p.id AS profesor_id,
        cm.id AS curso_materia_id,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        c.id AS curso_id,
        c.institucion_id,
        c.anio,
        c.division
      FROM profe_curso_materia pcm
      INNER JOIN profesor p ON p.id = pcm.profesor_id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      WHERE pcm.id = $1
      LIMIT 1
    `, [profeCursoMateriaId]);

    return result.rows[0] || null;
  };

  getAlumnoCursoIdAsync = async (alumnoId) => {
    const result = await pool.query(`
      SELECT curso_id FROM alumno WHERE id = $1
    `, [alumnoId]);

    return result.rows[0]?.curso_id ?? null;
  };

  upsertAsync = async ({ alumno_id, curso_materia_id, bimestre_id, profesor_id, nota, observaciones }) => {
    await ensureIndiceUnico();
    const result = await pool.query(`
      INSERT INTO calificacion (
        alumno_id, curso_materia_id, bimestre_id, profesor_id, nota, observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (alumno_id, curso_materia_id, bimestre_id)
      DO UPDATE SET
        nota = EXCLUDED.nota,
        observaciones = EXCLUDED.observaciones,
        profesor_id = EXCLUDED.profesor_id,
        fecha_modificacion = NOW()
      RETURNING *
    `, [
      alumno_id,
      curso_materia_id,
      bimestre_id,
      profesor_id,
      nota,
      observaciones || null
    ]);

    return result.rows[0];
  };

  // Todas las materias del curso del alumno, tenga o no calificaciones cargadas (para el boletín)
  getMateriasByAlumnoAsync = async (alumnoId) => {
    const result = await pool.query(`
      SELECT DISTINCT
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        cm.id AS curso_materia_id
      FROM alumno a
      INNER JOIN curso_materia cm ON cm.curso_id = a.curso_id
      INNER JOIN materia m ON m.id = cm.materia_id
      WHERE a.id = $1
      ORDER BY m.nombre
    `, [alumnoId]);

    return result.rows;
  };

  getByAlumnoAsync = async (alumnoId) => {
    const result = await pool.query(`
      SELECT
        cal.id,
        cal.nota,
        cal.observaciones,
        cal.fecha_registro,
        cal.fecha_modificacion,
        b.id AS bimestre_id,
        b.nombre AS bimestre_nombre,
        b.anio,
        b.orden,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        cm.id AS curso_materia_id
      FROM calificacion cal
      INNER JOIN bimestre b ON b.id = cal.bimestre_id
      -- Solo materias del curso actual del alumno: una calificación cargada
      -- sobre una materia de otro curso no debe aparecer en su boletín
      INNER JOIN alumno a ON a.id = cal.alumno_id
      INNER JOIN curso_materia cm ON cm.id = cal.curso_materia_id AND cm.curso_id = a.curso_id
      INNER JOIN materia m ON m.id = cm.materia_id
      WHERE cal.alumno_id = $1
      ORDER BY b.anio DESC, b.orden DESC, m.nombre
    `, [alumnoId]);

    return result.rows;
  };

  // Roster completo de alumnos del curso de esa materia, con su calificación
  // para ESE bimestre si ya existe (null si todavía no fue cargada).
  getByCursoMateriaAsync = async (cursoMateriaId, bimestreId) => {
    const result = await pool.query(`
      SELECT
        al.id AS alumno_id,
        u.nombre AS alumno_nombre,
        u.apellido AS alumno_apellido,
        cal.id,
        cal.bimestre_id,
        cal.nota,
        cal.observaciones,
        cal.fecha_registro,
        cal.fecha_modificacion
      FROM curso_materia cm
      INNER JOIN alumno al ON al.curso_id = cm.curso_id
      INNER JOIN usuario u ON u.id = al.usuario_id
      LEFT JOIN calificacion cal
        ON cal.alumno_id = al.id
        AND cal.curso_materia_id = cm.id
        AND cal.bimestre_id = $2
      WHERE cm.id = $1
      ORDER BY u.apellido, u.nombre
    `, [cursoMateriaId, bimestreId]);

    return result.rows;
  };
}
