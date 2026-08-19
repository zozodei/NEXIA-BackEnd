/* Genera un campus completo y coherente sobre la institución existente:
   alumnos por curso, plan de estudios, material de estudio, trabajos prácticos
   con sus entregas y correcciones, calificaciones por bimestre y el historial
   de clases con la asistencia tomada.

   Es idempotente: cada fase verifica lo que ya existe antes de insertar, así
   que se puede volver a correr sin duplicar nada.

   Uso:
     node scripts/seed-campus.js              -> muestra qué haría
     node scripts/seed-campus.js --confirmar  -> aplica los cambios
*/

import bcrypt from 'bcryptjs';
import pool from '../src/database/db.js';
import {
  NOMBRES_F, NOMBRES_M, APELLIDOS, CIUDADES,
  FERIADOS_2026, RECESO_INVERNAL, MATERIAS, COMUNICADOS, EVENTOS
} from './datos/catalogos.js';

const CONFIRMAR = process.argv.includes('--confirmar');
const HOY = '2026-08-19';
const ALUMNOS_OBJETIVO = { min: 24, max: 28 };

const SUPABASE_BASE = (process.env.SUPABASE_URL || 'https://cerfjvmqqodicksjvkdf.supabase.co')
  .replace(/\/$/, '');

/* ---------- Aleatoriedad determinística ----------
   Con la misma semilla el script genera siempre el mismo campus, así que
   correrlo de nuevo o en otra máquina da el mismo resultado. */
const hashSemilla = (texto) => {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const rng = (semilla) => {
  let a = hashSemilla(String(semilla));
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const elegir = (r, lista) => lista[Math.floor(r() * lista.length)];
const entre = (r, min, max) => min + Math.floor(r() * (max - min + 1));
// Suma de tres uniformes: da una campana suave, sin los extremos planos del uniforme
const campana = (r) => (r() + r() + r()) / 3;

/* ---------- Fechas ---------- */
const aFecha = (iso) => new Date(`${iso}T12:00:00Z`);
const aISO = (fecha) => fecha.toISOString().slice(0, 10);
const sumarDias = (iso, dias) => {
  const f = aFecha(iso);
  f.setUTCDate(f.getUTCDate() + dias);
  return aISO(f);
};
const diaSemana = (iso) => aFecha(iso).getUTCDay(); // 0 domingo … 6 sábado

const esNoLectivo = (iso) =>
  FERIADOS_2026.includes(iso) ||
  (iso >= RECESO_INVERNAL.desde && iso <= RECESO_INVERNAL.hasta) ||
  diaSemana(iso) === 0 || diaSemana(iso) === 6;

/* ---------- Texto ---------- */
const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (t) => sinAcentos(t).toLowerCase().replace(/[^a-z0-9]+/g, '');

/* ---------- Inserción por lotes ---------- */
const insertarEnLotes = async (client, tabla, columnas, filas, { devolverIds = false, tamLote = 500 } = {}) => {
  const ids = [];

  for (let i = 0; i < filas.length; i += tamLote) {
    const lote = filas.slice(i, i + tamLote);
    const valores = [];
    const marcadores = lote.map((fila, f) =>
      `(${columnas.map((_, c) => `$${f * columnas.length + c + 1}`).join(', ')})`
    );
    lote.forEach((fila) => valores.push(...fila));

    const sql = `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES ${marcadores.join(', ')}` +
      (devolverIds ? ' RETURNING id' : '');

    const res = await client.query(sql, valores);
    if (devolverIds) ids.push(...res.rows.map((r) => r.id));
  }

  return ids;
};

/* ---------- Perfiles académicos ----------
   Cada alumno tiene una aptitud general estable y una afinidad por materia.
   De ahí salen las notas, las entregas y la asistencia, para que el boletín
   de un alumno sea coherente consigo mismo a lo largo de todo el año. */
const perfilAlumno = (alumnoId) => {
  const r = rng(`perfil-${alumnoId}`);
  const aptitud = campana(r);                 // 0 = le cuesta mucho, 1 = excelente
  const constancia = 0.35 + campana(r) * 0.65; // afecta si entrega los TPs
  const asistenciaBase = 0.80 + aptitud * 0.14 + r() * 0.05;
  return { aptitud, constancia, asistenciaBase: Math.min(asistenciaBase, 0.98) };
};

const afinidadMateria = (alumnoId, materia) => {
  const r = rng(`afin-${alumnoId}-${materia}`);
  return (campana(r) - 0.5) * 3; // aprox -1.5 … +1.5
};

const notaDe = (alumnoId, materia, ordenBimestre) => {
  const { aptitud } = perfilAlumno(alumnoId);
  const r = rng(`nota-${alumnoId}-${materia}-${ordenBimestre}`);
  // Leve mejora a lo largo del año: el alumno se acomoda a la materia
  const progreso = (ordenBimestre - 1) * 0.25;
  const bruto = 3.6 + aptitud * 6.4 + afinidadMateria(alumnoId, materia) + (r() - 0.5) * 1.4 + progreso;
  const acotado = Math.max(1, Math.min(10, bruto));
  return Math.round(acotado * 2) / 2; // notas de media en media, como en el papel
};

/* ---------- Comentarios de corrección ---------- */
const comentarioCorreccion = (nota, r) => {
  if (nota >= 9) return elegir(r, [
    'Excelente trabajo. Muy prolijo y bien fundamentado.',
    'Muy buena resolución, se nota el estudio previo. Felicitaciones.',
    'Trabajo completo y bien presentado. Sigue así.',
    'Impecable. Resolvió todos los puntos con claridad.'
  ]);
  if (nota >= 7) return elegir(r, [
    'Buen trabajo. Revisar la justificación del punto 3.',
    'Correcto en general, faltó desarrollar un poco más la conclusión.',
    'Bien resuelto. Cuidar la presentación y la ortografía.',
    'Cumple con lo pedido. Podés profundizar el análisis final.'
  ]);
  if (nota >= 6) return elegir(r, [
    'Aprobado. Hay errores de procedimiento que conviene repasar.',
    'Alcanza lo mínimo pedido. Faltan los desarrollos de varios ejercicios.',
    'Cumple parcialmente. Revisar los temas del último bloque.'
  ]);
  return elegir(r, [
    'Desaprobado. Faltan ejercicios y hay errores conceptuales. Consultar en clase.',
    'No alcanza los objetivos mínimos. Se puede recuperar en la próxima instancia.',
    'Entrega incompleta. Rehacer los puntos 2, 4 y 5 para la recuperación.',
    'Hay confusión en los conceptos centrales. Acercate a consulta antes de la recuperación.'
  ]);
};

const comentarioAlumno = (r) => elegir(r, [
  null, null, null,
  'Profe, subo el trabajo. Cualquier cosa avíseme.',
  'Adjunto el TP. El punto 4 no me terminó de salir.',
  'Buenas, entrego el trabajo. Gracias.',
  'Lo hice con Martina, está en los dos nombres.',
  'Perdón la demora, tuve problemas para subirlo.',
  'Va el trabajo corregido según lo que charlamos en clase.'
]);

const observacionAusencia = (estado, r) => {
  if (estado === 'justificado') return elegir(r, [
    'Presenta certificado médico.',
    'Turno médico, avisado por la familia.',
    'Trámite de documentación, nota firmada por el tutor.',
    'Competencia deportiva representando a la institución.',
    'Certificado por cuadro febril.'
  ]);
  if (estado === 'tardanza') return elegir(r, [
    null, null,
    'Llegó 15 minutos tarde.',
    'Ingresa tarde por demora en el transporte.',
    'Se reincorpora sobre el final de la primera hora.'
  ]);
  return elegir(r, [null, null, null, null, 'Sin aviso de la familia.']);
};

/* ================= INICIO ================= */

console.log(CONFIRMAR
  ? '=== SEED DEL CAMPUS — modo real ==='
  : '=== SEED DEL CAMPUS — simulación (agregá --confirmar para aplicar) ===');

const client = await pool.connect();
const resumen = {};

try {
  await client.query('BEGIN');

  /* ---------- Contexto actual ---------- */
  const { rows: [institucion] } = await client.query('SELECT * FROM institucion ORDER BY id LIMIT 1');
  const { rows: cursos } = await client.query('SELECT * FROM curso ORDER BY anio, division');
  const { rows: materias } = await client.query('SELECT * FROM materia ORDER BY id');
  const { rows: bimestres } = await client.query('SELECT * FROM bimestre ORDER BY orden');
  const { rows: tiposContenido } = await client.query('SELECT * FROM tipo_contenido');
  const { rows: profesores } = await client.query('SELECT * FROM profesor ORDER BY id');
  const { rows: gestores } = await client.query('SELECT * FROM gestor ORDER BY id LIMIT 1');

  const materiaPorNombre = Object.fromEntries(materias.map((m) => [m.nombre, m]));
  const tipoPorNombre = Object.fromEntries(tiposContenido.map((t) => [t.nombre, t.id]));

  /* ============ FASE 1: plan de estudios de los cursos incompletos ============ */
  const PLAN = {
    1: ['Programación', 'Base de Datos', 'Matemática', 'Física', 'Química', 'Inglés'],
    2: ['Matemática', 'Historia', 'Literatura', 'Inglés', 'Comunicación', 'Base de Datos']
  };

  let cursoMateriasCreadas = 0;
  let pcmCreados = 0;

  for (const curso of cursos) {
    const plan = PLAN[curso.especialidad_id] || PLAN[1];

    for (const nombreMateria of plan) {
      const materia = materiaPorNombre[nombreMateria];
      if (!materia) continue;

      const { rows: existe } = await client.query(
        'SELECT id FROM curso_materia WHERE curso_id = $1 AND materia_id = $2',
        [curso.id, materia.id]
      );

      let cursoMateriaId = existe[0]?.id;

      if (!cursoMateriaId) {
        const { rows: [nueva] } = await client.query(
          'INSERT INTO curso_materia (curso_id, materia_id) VALUES ($1, $2) RETURNING id',
          [curso.id, materia.id]
        );
        cursoMateriaId = nueva.id;
        cursoMateriasCreadas++;
      }

      const { rows: tienePcm } = await client.query(
        'SELECT id FROM profe_curso_materia WHERE curso_materia_id = $1',
        [cursoMateriaId]
      );

      if (!tienePcm.length) {
        // Se asigna el profesor que ya dicta esa materia en otro curso; si no
        // hay ninguno, se reparte entre los profesores existentes.
        const { rows: [candidato] } = await client.query(`
          SELECT pcm.profesor_id, COUNT(*)::int AS carga
          FROM profe_curso_materia pcm
          JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
          WHERE cm.materia_id = $1
          GROUP BY pcm.profesor_id
          ORDER BY carga ASC
          LIMIT 1
        `, [materia.id]);

        const r = rng(`pcm-${cursoMateriaId}`);
        const profesorId = candidato?.profesor_id ?? elegir(r, profesores).id;

        await client.query(
          'INSERT INTO profe_curso_materia (curso_materia_id, profesor_id) VALUES ($1, $2)',
          [cursoMateriaId, profesorId]
        );
        pcmCreados++;
      }
    }
  }

  resumen['curso_materia creados'] = cursoMateriasCreadas;
  resumen['profe_curso_materia creados'] = pcmCreados;

  /* ============ FASE 2: alumnos hasta completar cada curso ============ */
  const { rows: dnisUsados } = await client.query('SELECT dni FROM usuario UNION SELECT dni::varchar FROM director UNION SELECT dni FROM gestor');
  const dnis = new Set(dnisUsados.map((d) => String(d.dni)));

  const { rows: emailsUsados } = await client.query('SELECT email FROM usuario');
  const emails = new Set(emailsUsados.map((e) => e.email.toLowerCase()));

  let alumnosCreados = 0;

  for (const curso of cursos) {
    const { rows: [{ c: actuales }] } = await client.query(
      'SELECT COUNT(*)::int AS c FROM alumno WHERE curso_id = $1', [curso.id]
    );

    const r = rng(`curso-${curso.id}`);
    const objetivo = entre(r, ALUMNOS_OBJETIVO.min, ALUMNOS_OBJETIVO.max);
    const faltan = objetivo - actuales;

    if (faltan <= 0) continue;

    // Los de 4° nacieron en 2009, los de 5° en 2008
    const anioNacimiento = curso.anio === 4 ? 2009 : 2008;

    for (let i = 0; i < faltan; i++) {
      const rp = rng(`alumno-${curso.id}-${i}`);
      const esVaron = rp() < 0.5;
      const nombre = elegir(rp, esVaron ? NOMBRES_M : NOMBRES_F);
      const apellido = elegir(rp, APELLIDOS);

      let dni;
      do {
        dni = String(entre(rp, 47_600_000, 50_400_000));
      } while (dnis.has(dni));
      dnis.add(dni);

      let email = `${slug(nombre)}.${slug(apellido)}@nexia.edu.ar`;
      let sufijo = 1;
      while (emails.has(email)) {
        email = `${slug(nombre)}.${slug(apellido)}${++sufijo}@nexia.edu.ar`;
      }
      emails.add(email);

      const fechaNacimiento = `${anioNacimiento}-${String(entre(rp, 1, 12)).padStart(2, '0')}-${String(entre(rp, 1, 28)).padStart(2, '0')}`;

      const avatar = {
        eyes: elegir(rp, ['#A97C3F', '#4C8B5A', '#4A80C4', '#78889B', '#6B4423']),
        hair: {
          color: elegir(rp, ['#1C1A1A', '#4A2C1A', '#D9A441', '#E5559B', '#8B4FD1']),
          style: elegir(rp, ['corto', 'largo', 'medio', 'rizado', 'rapado'])
        },
        skin: elegir(rp, ['#EFC09A', '#F5D0B0', '#B87C4F', '#DBA478', '#5A3A1F']),
        accessories: {
          hat: elegir(rp, [null, null, null, 'gorra', 'vincha', 'nexia']),
          glasses: elegir(rp, [null, null, null, 'sol'])
        },
        shirt_color: elegir(rp, ['#1A237E', '#FF9800', '#2E7D32', '#B71C1C', '#4A148C', '#00695C'])
      };

      const passwordHash = await bcrypt.hash(dni, 10);

      const { rows: [usuario] } = await client.query(`
        INSERT INTO usuario (
          institucion_id, nombre, apellido, email, password, dni, rol, activo,
          tema, idioma, notificaciones_email, avatar_config, telefono,
          fecha_nacimiento, genero, ciudad, pais
        ) VALUES ($1,$2,$3,$4,$5,$6,'ALUMNO',true,$7,'es',$8,$9,$10,$11,$12,$13,'Argentina')
        RETURNING id
      `, [
        institucion.id, nombre, apellido, email, passwordHash, dni,
        rp() < 0.35 ? 'oscuro' : 'claro',
        rp() < 0.8,
        JSON.stringify(avatar),
        `11${entre(rp, 3000, 7999)}${entre(rp, 1000, 9999)}`,
        fechaNacimiento,
        esVaron ? 'masculino' : 'femenino',
        elegir(rp, CIUDADES)
      ]);

      await client.query(
        'INSERT INTO alumno (usuario_id, curso_id) VALUES ($1, $2)',
        [usuario.id, curso.id]
      );
      alumnosCreados++;
    }
  }

  resumen['alumnos creados'] = alumnosCreados;

  /* ============ FASE 3: completar perfiles vacíos de los usuarios que ya estaban ============ */
  const { rows: sinPerfil } = await client.query(`
    SELECT u.id, u.nombre, u.rol FROM usuario u
    WHERE u.telefono IS NULL OR u.fecha_nacimiento IS NULL OR u.ciudad IS NULL
  `);

  for (const u of sinPerfil) {
    const rp = rng(`perfilviejo-${u.id}`);
    const anio = u.rol === 'PROFESOR' ? entre(rp, 1975, 1995) : entre(rp, 2008, 2009);

    await client.query(`
      UPDATE usuario SET
        telefono = COALESCE(telefono, $2),
        fecha_nacimiento = COALESCE(fecha_nacimiento, $3::date),
        ciudad = COALESCE(ciudad, $4),
        pais = COALESCE(pais, 'Argentina')
      WHERE id = $1
    `, [
      u.id,
      `11${entre(rp, 3000, 7999)}${entre(rp, 1000, 9999)}`,
      `${anio}-${String(entre(rp, 1, 12)).padStart(2, '0')}-${String(entre(rp, 1, 28)).padStart(2, '0')}`,
      elegir(rp, CIUDADES)
    ]);
  }

  resumen['perfiles completados'] = sinPerfil.length;

  /* ---------- Mapa completo de materias dictadas ---------- */
  const { rows: dictados } = await client.query(`
    SELECT pcm.id AS pcm_id, pcm.profesor_id, cm.id AS curso_materia_id,
           cm.curso_id, c.anio, c.division, m.id AS materia_id, m.nombre AS materia
    FROM profe_curso_materia pcm
    JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
    JOIN curso c ON c.id = cm.curso_id
    JOIN materia m ON m.id = cm.materia_id
    ORDER BY c.anio, c.division, m.nombre
  `);

  const { rows: alumnos } = await client.query(`
    SELECT a.id, a.curso_id FROM alumno a ORDER BY a.curso_id, a.id
  `);

  const alumnosPorCurso = alumnos.reduce((acc, a) => {
    (acc[a.curso_id] ??= []).push(a.id);
    return acc;
  }, {});

  /* ============ FASE 4: material de estudio ============ */
  const contenidosNuevos = [];

  for (const d of dictados) {
    const config = MATERIAS[d.materia];
    if (!config) continue;

    const { rows: yaTiene } = await client.query(
      'SELECT titulo FROM contenido WHERE profe_curso_materia_id = $1', [d.pcm_id]
    );
    const titulos = new Set(yaTiene.map((c) => c.titulo));

    for (const c of config.contenidos) {
      if (titulos.has(c.titulo)) continue;
      const tipoId = tipoPorNombre[c.tipo] ?? tipoPorNombre['LINK'];
      contenidosNuevos.push([d.pcm_id, tipoId, c.titulo, `Material de ${d.materia} — ${d.anio}°${d.division}`, c.url]);
    }
  }

  if (CONFIRMAR && contenidosNuevos.length) {
    await insertarEnLotes(client, 'contenido',
      ['profe_curso_materia_id', 'tipo_contenido_id', 'titulo', 'descripcion', 'archivo_url'],
      contenidosNuevos);
  }
  resumen['contenidos creados'] = contenidosNuevos.length;

  /* ============ FASE 5: trabajos prácticos ============ */
  /* Calendario del año: TP1 vence en el 1er bimestre, TP2 en el 2do, TP3 está
     abierto ahora (3er bimestre) y TP4 queda en borrador sin publicar. */
  const PLANTILLA_TP = [
    { indice: 0, limite: '2026-04-24', publicado: '2026-03-30', activo: true, estado: 'vencido' },
    { indice: 1, limite: '2026-06-19', publicado: '2026-05-25', activo: true, estado: 'vencido' },
    { indice: 2, limite: '2026-09-04', publicado: '2026-08-10', activo: true, estado: 'abierto' },
    { indice: 3, limite: null, publicado: null, activo: false, estado: 'borrador' }
  ];

  const tpsCreados = [];

  for (const d of dictados) {
    const config = MATERIAS[d.materia];
    if (!config) continue;

    const { rows: yaTiene } = await client.query(
      'SELECT titulo FROM trabajo_practico WHERE profe_curso_materia_id = $1', [d.pcm_id]
    );
    const titulos = new Set(yaTiene.map((t) => t.titulo));

    for (const plantilla of PLANTILLA_TP) {
      const tp = config.tps[plantilla.indice];
      if (!tp || titulos.has(tp.titulo)) continue;

      // Cada docente corre unos días su fecha límite, no todos entregan el mismo día
      const r = rng(`tp-${d.pcm_id}-${plantilla.indice}`);
      const corrimiento = entre(r, -3, 4);
      const limite = plantilla.limite ? `${sumarDias(plantilla.limite, corrimiento)} 23:59:00` : null;
      const publicado = plantilla.publicado ? `${sumarDias(plantilla.publicado, corrimiento)} 08:00:00` : null;

      if (CONFIRMAR) {
        const { rows: [creado] } = await client.query(`
          INSERT INTO trabajo_practico (
            profe_curso_materia_id, titulo, descripcion, archivo_url,
            fecha_publicacion, fecha_limite, activo
          ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
        `, [
          d.pcm_id, tp.titulo, tp.descripcion,
          plantilla.activo ? `${SUPABASE_BASE}/storage/v1/object/public/entregables/consignas/${slug(d.materia)}-tp${plantilla.indice + 1}-${d.anio}${d.division}.pdf` : null,
          publicado, limite, plantilla.activo
        ]);
        tpsCreados.push({ id: creado.id, ...plantilla, pcm: d, limite });
      } else {
        tpsCreados.push({ id: null, ...plantilla, pcm: d, limite });
      }
    }
  }

  resumen['trabajos prácticos creados'] = tpsCreados.length;

  /* ============ FASE 6: entregas y correcciones ============ */
  const entregasNuevas = [];

  for (const tp of tpsCreados) {
    if (tp.estado === 'borrador') continue;

    const alumnosDelCurso = alumnosPorCurso[tp.pcm.curso_id] ?? [];
    // De un TP ya vencido entregó casi todo el curso; del que está abierto,
    // por ahora entregó menos de la mitad.
    const tasaBase = tp.estado === 'vencido' ? 0.93 : 0.42;

    for (const alumnoId of alumnosDelCurso) {
      const r = rng(`entrega-${tp.id ?? tp.pcm.pcm_id}-${tp.indice}-${alumnoId}`);
      const { constancia } = perfilAlumno(alumnoId);

      if (r() > tasaBase * (0.7 + constancia * 0.45)) continue;

      const diasAntes = entre(r, 0, 9);
      const fechaEntrega = `${sumarDias(tp.limite.slice(0, 10), -diasAntes)} ${String(entre(r, 9, 23)).padStart(2, '0')}:${String(entre(r, 0, 59)).padStart(2, '0')}:00`;
      const archivo = `${SUPABASE_BASE}/storage/v1/object/public/entregables/${Date.parse(fechaEntrega.replace(' ', 'T') + 'Z')}-tp${tp.indice + 1}_${slug(tp.pcm.materia)}_alumno${alumnoId}.pdf`;

      if (tp.estado === 'abierto') {
        // Todavía no las corrigió el profesor
        entregasNuevas.push([tp.id, alumnoId, archivo, comentarioAlumno(r), fechaEntrega, 'pendiente', null, null, null]);
        continue;
      }

      const nota = notaDe(alumnoId, tp.pcm.materia, tp.indice + 1);
      const fechaCorreccion = `${sumarDias(tp.limite.slice(0, 10), entre(r, 5, 16))} ${String(entre(r, 15, 22)).padStart(2, '0')}:${String(entre(r, 0, 59)).padStart(2, '0')}:00`;

      entregasNuevas.push([
        tp.id, alumnoId, archivo, comentarioAlumno(r), fechaEntrega,
        'corregido', nota, comentarioCorreccion(nota, r), fechaCorreccion
      ]);
    }
  }

  if (CONFIRMAR && entregasNuevas.length) {
    await insertarEnLotes(client, 'entrega',
      ['trabajo_practico_id', 'alumno_id', 'archivo_url', 'comentario_alumno',
       'fecha_entrega', 'estado', 'nota', 'comentario_correccion', 'fecha_correccion'],
      entregasNuevas);
  }
  resumen['entregas creadas'] = entregasNuevas.length;

  /* ============ FASE 7: calificaciones por bimestre ============ */
  /* Hoy es 19/08: el 1er y 2do bimestre están cerrados y con todas las notas
     cargadas; el 3ro está en curso, así que sólo algunos docentes cargaron; el
     4to todavía no empezó. */
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS calificacion_alumno_cm_bimestre_unique
    ON calificacion (alumno_id, curso_materia_id, bimestre_id)
  `);

  const calificacionesNuevas = [];

  for (const d of dictados) {
    const alumnosDelCurso = alumnosPorCurso[d.curso_id] ?? [];

    for (const bimestre of bimestres) {
      if (bimestre.orden === 4) continue;

      if (bimestre.orden === 3) {
        // Sólo ~40% de los docentes ya cargó el bimestre en curso
        const r = rng(`bim3-${d.pcm_id}`);
        if (r() > 0.4) continue;
      }

      const cierre = bimestre.orden === 3 ? HOY : aISO(new Date(bimestre.fecha_fin));

      for (const alumnoId of alumnosDelCurso) {
        const r = rng(`calif-${alumnoId}-${d.curso_materia_id}-${bimestre.id}`);
        const nota = notaDe(alumnoId, d.materia, bimestre.orden);

        const observaciones = nota < 6
          ? elegir(r, [
              'Debe presentarse a la instancia de recuperación.',
              'No alcanzó los objetivos del bimestre. Se cita a la familia.',
              'Adeuda trabajos prácticos del bimestre.',
              null
            ])
          : elegir(r, [null, null, null, null, 'Muy buen desempeño y participación en clase.', 'Sostuvo el trabajo durante todo el bimestre.']);

        calificacionesNuevas.push([
          alumnoId, d.curso_materia_id, bimestre.id, d.profesor_id, nota,
          observaciones, `${sumarDias(cierre, -entre(r, 0, 5))} ${String(entre(r, 16, 22)).padStart(2, '0')}:${String(entre(r, 0, 59)).padStart(2, '0')}:00`
        ]);
      }
    }
  }

  if (CONFIRMAR && calificacionesNuevas.length) {
    // ON CONFLICT: si el alumno ya tenía una nota cargada a mano, se respeta
    for (let i = 0; i < calificacionesNuevas.length; i += 500) {
      const lote = calificacionesNuevas.slice(i, i + 500);
      const valores = [];
      const marcadores = lote.map((fila, f) => {
        valores.push(...fila);
        return `($${f * 7 + 1},$${f * 7 + 2},$${f * 7 + 3},$${f * 7 + 4},$${f * 7 + 5},$${f * 7 + 6},$${f * 7 + 7})`;
      });

      await client.query(`
        INSERT INTO calificacion (alumno_id, curso_materia_id, bimestre_id, profesor_id, nota, observaciones, fecha_registro)
        VALUES ${marcadores.join(',')}
        ON CONFLICT (alumno_id, curso_materia_id, bimestre_id) DO NOTHING
      `, valores);
    }
  }
  resumen['calificaciones creadas'] = calificacionesNuevas.length;

  /* ============ FASE 8: clases dictadas y asistencia ============ */
  /* Cada materia tiene días fijos en la semana. Se recorre el ciclo lectivo
     desde marzo hasta hoy salteando feriados y el receso invernal. */
  let totalClases = 0;
  let totalAsistencias = 0;

  for (const d of dictados) {
    const config = MATERIAS[d.materia];
    if (!config) continue;

    const r = rng(`horario-${d.pcm_id}`);
    const diasDisponibles = [1, 2, 3, 4, 5];
    const diasClase = [];

    for (let i = 0; i < config.cargaSemanal; i++) {
      const idx = Math.floor(r() * diasDisponibles.length);
      diasClase.push(diasDisponibles.splice(idx, 1)[0]);
    }

    const { rows: yaHay } = await client.query(
      'SELECT fecha FROM clase WHERE profe_curso_materia_id = $1', [d.pcm_id]
    );
    const fechasExistentes = new Set(yaHay.map((c) => aISO(new Date(c.fecha))));

    const alumnosDelCurso = alumnosPorCurso[d.curso_id] ?? [];
    const clasesDelPcm = [];
    let indiceTema = 0;

    for (let fecha = '2026-03-02'; fecha <= HOY; fecha = sumarDias(fecha, 1)) {
      if (esNoLectivo(fecha)) continue;
      if (!diasClase.includes(diaSemana(fecha))) continue;

      const tema = config.temas[indiceTema % config.temas.length];
      indiceTema++;

      if (fechasExistentes.has(fecha)) continue;

      const rc = rng(`clase-${d.pcm_id}-${fecha}`);
      const observaciones = rc() < 0.12
        ? elegir(rc, [
            'Se trabajó en grupos. Quedó pendiente la puesta en común.',
            'Clase con menor asistencia por el paro de transporte.',
            'Se retomaron dudas del trabajo práctico anterior.',
            'Se usó el laboratorio de informática.',
            'Falta terminar el último ejercicio para la próxima clase.'
          ])
        : null;

      clasesDelPcm.push({ fecha, tema, observaciones });
    }

    if (!clasesDelPcm.length) continue;

    if (CONFIRMAR) {
      const filasClase = clasesDelPcm.map((c) => [
        d.pcm_id, c.fecha, c.tema, c.observaciones,
        // La lista se cierra unos días después; las de esta semana siguen abiertas
        c.fecha < sumarDias(HOY, -5)
      ]);

      const idsClase = await insertarEnLotes(client, 'clase',
        ['profe_curso_materia_id', 'fecha', 'tema', 'observaciones', 'lista_cerrada'],
        filasClase, { devolverIds: true });

      const filasAsistencia = [];

      idsClase.forEach((claseId, i) => {
        const { fecha } = clasesDelPcm[i];

        for (const alumnoId of alumnosDelCurso) {
          const { asistenciaBase } = perfilAlumno(alumnoId);
          const ra = rng(`asis-${claseId}-${alumnoId}-${fecha}`);
          const dado = ra();

          // El sobrante de la franja de inasistencia se reparte en proporción
          // fija, así el porcentaje de ausentes no depende de cuán alta sea la
          // asistencia base del alumno.
          let estado;
          if (dado < asistenciaBase) {
            estado = 'presente';
          } else {
            const resto = (dado - asistenciaBase) / (1 - asistenciaBase);
            if (resto < 0.55) estado = 'ausente';
            else if (resto < 0.80) estado = 'tardanza';
            else estado = 'justificado';
          }

          filasAsistencia.push([
            claseId, alumnoId, estado,
            estado === 'presente' ? null : observacionAusencia(estado, ra),
            d.profesor_id,
            `${fecha} ${String(entre(ra, 8, 17)).padStart(2, '0')}:${String(entre(ra, 0, 59)).padStart(2, '0')}:00`
          ]);
        }
      });

      await insertarEnLotes(client, 'asistencia',
        ['clase_id', 'alumno_id', 'estado', 'observaciones', 'registrado_por', 'fecha_registro'],
        filasAsistencia, { tamLote: 400 });

      totalAsistencias += filasAsistencia.length;
    } else {
      totalAsistencias += clasesDelPcm.length * alumnosDelCurso.length;
    }

    totalClases += clasesDelPcm.length;
  }

  resumen['clases creadas'] = totalClases;
  resumen['asistencias creadas'] = totalAsistencias;

  /* ============ FASE 9: comunicados y calendario ============ */
  const gestorId = gestores[0]?.id ?? institucion.gestor_id;
  let comunicadosCreados = 0;

  for (const c of COMUNICADOS) {
    const { rows: existe } = await client.query(
      'SELECT id FROM comunicado WHERE titulo = $1 AND institucion_id = $2', [c.titulo, institucion.id]
    );
    if (existe.length) continue;

    if (CONFIRMAR) {
      await client.query(`
        INSERT INTO comunicado (institucion_id, gestor_id, titulo, contenido, fecha_publicacion, activo)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [institucion.id, gestorId, c.titulo, c.contenido, `${c.fecha} 09:00:00`, c.activo]);
    }
    comunicadosCreados++;
  }
  resumen['comunicados creados'] = comunicadosCreados;

  let eventosCreados = 0;

  for (const e of EVENTOS) {
    const { rows: existe } = await client.query(
      'SELECT id FROM evento_calendario WHERE titulo = $1 AND fecha = $2::date', [e.titulo, e.fecha]
    );
    if (existe.length) continue;

    if (CONFIRMAR) {
      await client.query(`
        INSERT INTO evento_calendario (institucion_id, gestor_id, titulo, descripcion, fecha, tipo)
        VALUES ($1,$2,$3,$4,$5::date,$6)
      `, [institucion.id, gestorId, e.titulo, e.descripcion, e.fecha, e.tipo]);
    }
    eventosCreados++;
  }
  resumen['eventos creados'] = eventosCreados;

  /* ---------- Cierre ---------- */
  if (CONFIRMAR) {
    await client.query('COMMIT');
    console.log('\nSeed aplicado correctamente.\n');
  } else {
    await client.query('ROLLBACK');
    console.log('\nSimulación: no se guardó nada. Volvé a correr con --confirmar.\n');
  }

  console.table(resumen);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('\nError — se revirtió todo:', error.message);
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
