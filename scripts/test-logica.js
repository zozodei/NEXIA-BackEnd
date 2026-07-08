/* Test de consistencia de la lógica profesor ↔ curso ↔ materia ↔ alumno.
   Solo lecturas (ninguna escritura). Se ejecuta contra la BD del .env. */
import dotenv from 'dotenv';
import pg from 'pg';


dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const tests = [];
const test = (nombre, fn) => tests.push({ nombre, fn });

// 1. Contenidos cuyo pcm no coincide con el curso de la materia (integridad del join)
test('Contenidos huérfanos (pcm inexistente)', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n FROM contenido con
    LEFT JOIN profe_curso_materia pcm ON pcm.id = con.profe_curso_materia_id
    WHERE pcm.id IS NULL
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} contenidos sin pcm válido` };
});

// 2. TPs huérfanos
test('TPs huérfanos (pcm inexistente)', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n FROM trabajo_practico tp
    LEFT JOIN profe_curso_materia pcm ON pcm.id = tp.profe_curso_materia_id
    WHERE pcm.id IS NULL
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} TPs sin pcm válido` };
});

// 3. Entregas de alumnos que NO pertenecen al curso del TP (violación de la regla central)
test('Entregas de alumnos de otro curso', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n
    FROM entrega e
    INNER JOIN alumno a ON a.id = e.alumno_id
    INNER JOIN trabajo_practico tp ON tp.id = e.trabajo_practico_id
    INNER JOIN profe_curso_materia pcm ON pcm.id = tp.profe_curso_materia_id
    INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
    WHERE a.curso_id <> cm.curso_id
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} entregas cruzadas de curso` };
});

// 4. Calificaciones donde el alumno no pertenece al curso de la curso_materia
test('Calificaciones de alumnos de otro curso', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n
    FROM calificacion cal
    INNER JOIN alumno a ON a.id = cal.alumno_id
    INNER JOIN curso_materia cm ON cm.id = cal.curso_materia_id
    WHERE a.curso_id <> cm.curso_id
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} calificaciones cruzadas de curso` };
});

// 5. Calificaciones puestas por un profesor que NO enseña esa curso_materia
test('Calificaciones de profesor que no enseña la materia', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n
    FROM calificacion cal
    WHERE NOT EXISTS (
      SELECT 1 FROM profe_curso_materia pcm
      WHERE pcm.curso_materia_id = cal.curso_materia_id
        AND pcm.profesor_id = cal.profesor_id
    )
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} notas de profesor ajeno a la materia` };
});

// 6. Duplicados en calificacion que romperían el índice único nuevo
test('Duplicados alumno+materia+bimestre en calificacion', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n FROM (
      SELECT alumno_id, curso_materia_id, bimestre_id
      FROM calificacion
      GROUP BY alumno_id, curso_materia_id, bimestre_id
      HAVING COUNT(*) > 1
    ) d
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} combinaciones duplicadas` };
});

// 7. pcm duplicados (mismo profesor asignado dos veces a la misma curso_materia)
test('Asignaciones profe_curso_materia duplicadas', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n FROM (
      SELECT curso_materia_id, profesor_id
      FROM profe_curso_materia
      GROUP BY curso_materia_id, profesor_id
      HAVING COUNT(*) > 1
    ) d
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} asignaciones duplicadas` };
});

// 8. curso_materia duplicadas (misma materia dos veces en el mismo curso)
test('curso_materia duplicadas', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n FROM (
      SELECT curso_id, materia_id
      FROM curso_materia
      GROUP BY curso_id, materia_id
      HAVING COUNT(*) > 1
    ) d
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} pares curso+materia duplicados` };
});

// 9. Cursos del profesor vs institución: pcm que cruza instituciones
//    (profesor de institución A asignado a un curso de institución B)
test('Profesores asignados a cursos de otra institución', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n
    FROM profe_curso_materia pcm
    INNER JOIN profesor p ON p.id = pcm.profesor_id
    INNER JOIN usuario u ON u.id = p.usuario_id
    INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
    INNER JOIN curso c ON c.id = cm.curso_id
    WHERE u.institucion_id <> c.institucion_id
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} asignaciones cruzadas de institución` };
});

// 10. Alumnos en cursos de otra institución
test('Alumnos en cursos de otra institución', async () => {
  const r = await pool.query(`
    SELECT COUNT(*) AS n
    FROM alumno a
    INNER JOIN usuario u ON u.id = a.usuario_id
    INNER JOIN curso c ON c.id = a.curso_id
    WHERE u.institucion_id <> c.institucion_id
  `);
  return { falla: Number(r.rows[0].n) > 0, detalle: `${r.rows[0].n} alumnos cruzados de institución` };
});

const run = async () => {
  let fallas = 0;
  for (const { nombre, fn } of tests) {
    try {
      const { falla, detalle } = await fn();
      console.log(`${falla ? 'FALLA ' : 'OK    '} ${nombre} — ${detalle}`);
      if (falla) fallas++;
    } catch (e) {
      console.log(`ERROR  ${nombre} — ${e.message}`);
      fallas++;
    }
  }
  console.log(`\n${fallas === 0 ? 'Todos los chequeos pasaron.' : fallas + ' chequeo(s) con problemas.'}`);
  await pool.end();
};

run();
