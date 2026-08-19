/* Elimina los registros de prueba que quedaron del desarrollo (títulos tipo
   "test 1", notas fuera de rango, asignaciones duplicadas de profesor).
   Sin --confirmar sólo lista lo que borraría.

   Uso: node scripts/limpiar-datos-prueba.js [--confirmar] */

import pool from '../src/database/db.js';

const CONFIRMAR = process.argv.includes('--confirmar');

// Títulos/contenidos que son claramente basura de testing
const TITULOS_BASURA = [
  'test 1', 'sdas', 'Hola bebe ', 'TP PRUEBA', 'Mosj', 'fsdf', 'Hola como estan'
];

const listar = async (label, sql, params = []) => {
  const r = await pool.query(sql, params);
  console.log(`\n--- ${label}: ${r.rows.length} ---`);
  if (r.rows.length) console.table(r.rows);
  return r.rows;
};

console.log(CONFIRMAR ? '=== MODO REAL: se van a borrar registros ===' : '=== SIMULACIÓN (sin --confirmar no se borra nada) ===');

// 1. TPs de prueba (y sus entregas)
const tpsBasura = await listar('Trabajos prácticos de prueba', `
  SELECT id, titulo, descripcion FROM trabajo_practico
  WHERE titulo = ANY($1)
     OR titulo ILIKE '%borrador%'
     OR descripcion IN ('sddsaasddsa','asdasd','sdffsdsfd','sadads','nada','fndksnklnsdklslkfd')
  ORDER BY id`, [TITULOS_BASURA]);

// 2. Comunicados de prueba
const comBasura = await listar('Comunicados de prueba', `
  SELECT id, titulo, contenido FROM comunicado
  WHERE titulo = ANY($1) OR contenido IN ('rsdgddsg','sfdsdf','sdsdsdf')
  ORDER BY id`, [TITULOS_BASURA]);

// 3. Calificaciones con nota fuera del rango 0-10
const notasInvalidas = await listar('Calificaciones fuera de rango', `
  SELECT id, alumno_id, curso_materia_id, bimestre_id, nota FROM calificacion
  WHERE nota < 0 OR nota > 10 ORDER BY id`);

// 4. profe_curso_materia duplicados: misma curso_materia asignada varias veces.
//    Se conserva el de menor id (el original) y se descartan los repetidos que
//    no tengan contenido/TPs/clases colgando.
const pcmDuplicados = await listar('Asignaciones profesor-materia duplicadas', `
  SELECT pcm.id, cm.curso_id, m.nombre AS materia, pcm.profesor_id
  FROM profe_curso_materia pcm
  JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
  JOIN materia m ON m.id = cm.materia_id
  WHERE pcm.id > (
    SELECT MIN(p2.id) FROM profe_curso_materia p2 WHERE p2.curso_materia_id = pcm.curso_materia_id
  )
  AND NOT EXISTS (SELECT 1 FROM contenido c WHERE c.profe_curso_materia_id = pcm.id)
  AND NOT EXISTS (SELECT 1 FROM trabajo_practico t WHERE t.profe_curso_materia_id = pcm.id)
  AND NOT EXISTS (SELECT 1 FROM clase cl WHERE cl.profe_curso_materia_id = pcm.id)
  ORDER BY pcm.id`);

// 5. Usuarios de prueba (y su fila de alumno/profesor)
const usuariosBasura = await listar('Usuarios de prueba', `
  SELECT id, nombre, apellido, email, dni, rol FROM usuario
  WHERE nombre = 'TestNombre' OR dni IN ('0000000000','00000000003')
  ORDER BY id`);

// 6. Clases sueltas creadas al probar el módulo de asistencia
const clasesPrueba = await listar('Clases de prueba del módulo asistencia', `
  SELECT id, profe_curso_materia_id, fecha, tema FROM clase
  WHERE tema ILIKE '%prueba automatizada%' OR tema IS NULL
  ORDER BY id`);

if (!CONFIRMAR) {
  console.log('\nNada fue borrado. Volvé a correr con --confirmar para aplicar.');
  process.exit(0);
}

const ids = (filas) => filas.map((f) => f.id);
const client = await pool.connect();

try {
  await client.query('BEGIN');

  if (tpsBasura.length) {
    await client.query('DELETE FROM entrega WHERE trabajo_practico_id = ANY($1)', [ids(tpsBasura)]);
    await client.query('DELETE FROM trabajo_practico WHERE id = ANY($1)', [ids(tpsBasura)]);
  }

  if (comBasura.length) {
    await client.query('DELETE FROM comunicado WHERE id = ANY($1)', [ids(comBasura)]);
  }

  if (notasInvalidas.length) {
    await client.query('DELETE FROM calificacion WHERE id = ANY($1)', [ids(notasInvalidas)]);
  }

  if (clasesPrueba.length) {
    await client.query('DELETE FROM asistencia WHERE clase_id = ANY($1)', [ids(clasesPrueba)]);
    await client.query('DELETE FROM clase WHERE id = ANY($1)', [ids(clasesPrueba)]);
  }

  if (pcmDuplicados.length) {
    await client.query('DELETE FROM profe_curso_materia WHERE id = ANY($1)', [ids(pcmDuplicados)]);
  }

  for (const u of usuariosBasura) {
    const alumno = await client.query('SELECT id FROM alumno WHERE usuario_id = $1', [u.id]);

    for (const a of alumno.rows) {
      await client.query('DELETE FROM asistencia WHERE alumno_id = $1', [a.id]);
      await client.query('DELETE FROM entrega WHERE alumno_id = $1', [a.id]);
      await client.query('DELETE FROM calificacion WHERE alumno_id = $1', [a.id]);
      await client.query('DELETE FROM apunte WHERE alumno_id = $1', [a.id]);
      await client.query('DELETE FROM estudio_sesion WHERE alumno_id = $1', [a.id]);
      await client.query('DELETE FROM estudio_objetivo WHERE alumno_id = $1', [a.id]);
      await client.query('DELETE FROM tarjeta WHERE mazo_id IN (SELECT id FROM mazo WHERE alumno_id = $1)', [a.id]);
      await client.query('DELETE FROM mazo WHERE alumno_id = $1', [a.id]);
      await client.query('DELETE FROM mapa_conceptual WHERE alumno_id = $1', [a.id]);
      await client.query('DELETE FROM alumno WHERE id = $1', [a.id]);
    }

    const profesor = await client.query('SELECT id FROM profesor WHERE usuario_id = $1', [u.id]);

    for (const p of profesor.rows) {
      // Sólo se puede borrar si no dicta nada; si dicta, se deja y se avisa
      const dicta = await client.query('SELECT COUNT(*)::int AS c FROM profe_curso_materia WHERE profesor_id = $1', [p.id]);

      if (dicta.rows[0].c > 0) {
        console.log(`  ! profesor ${p.id} (usuario ${u.id}) dicta materias, no se borra`);
        continue;
      }

      await client.query('UPDATE asistencia SET registrado_por = NULL WHERE registrado_por = $1', [p.id]);
      await client.query('DELETE FROM profesor WHERE id = $1', [p.id]);
    }

    const sigueReferenciado = await client.query(
      'SELECT (SELECT COUNT(*) FROM alumno WHERE usuario_id=$1) + (SELECT COUNT(*) FROM profesor WHERE usuario_id=$1) + (SELECT COUNT(*) FROM coordinador WHERE usuario_id=$1) AS c',
      [u.id]
    );

    if (Number(sigueReferenciado.rows[0].c) === 0) {
      await client.query('DELETE FROM usuario WHERE id = $1', [u.id]);
    }
  }

  await client.query('COMMIT');
  console.log('\nLimpieza aplicada correctamente.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('\nError — se revirtió todo:', error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
