/* Prueba end-to-end de la Zona de Estudio contra la base del .env.
   Crea datos con un alumno real y los borra al terminar (incluso si falla).
   Uso: node scripts/test-zona-estudio.js */
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const PUERTO = 3099;
process.env.PORT = String(PUERTO);

const BASE = `http://localhost:${PUERTO}`;

let fallos = 0;
const check = (etiqueta, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  console.log(`${ok ? 'PASS' : 'FALLA'}  ${etiqueta} -> ${JSON.stringify(real)}${ok ? '' : `  (esperado ${JSON.stringify(esperado)})`}`);
  if (!ok) fallos++;
};

const main = async () => {
  await import('../src/app.js');
  const { default: pool } = await import('../src/database/db.js');
  await new Promise((r) => setTimeout(r, 4000));

  const alumno = await pool.query(`
    SELECT a.id AS alumno_id, u.institucion_id, u.nombre
    FROM alumno a INNER JOIN usuario u ON u.id = a.usuario_id LIMIT 1
  `);

  if (!alumno.rows[0]) {
    console.log('No hay alumnos en la base — se omite la prueba.');
    process.exit(0);
  }

  const { alumno_id, institucion_id, nombre } = alumno.rows[0];
  console.log(`Alumno de prueba: ${nombre} (alumno_id ${alumno_id})\n`);

  const token = jwt.sign(
    { rol: 'ALUMNO', alumno_id, institucion_id },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  const H = { 'content-type': 'application/json', authorization: `Bearer ${token}` };

  const call = async (m, p, body) => {
    const r = await fetch(BASE + p, {
      method: m,
      headers: H,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  };

  const creado = { mazos: [], objetivos: [], mapas: [], apuntes: [] };

  try {
    // ── Objetivos ──────────────────────────
    console.log('── OBJETIVOS ──');
    const o = await call('POST', '/api/estudio/objetivos', { texto: '[qa] Repasar mitosis', pomodoros_estimados: 3 });
    check('crear objetivo', o.status, 201);
    creado.objetivos.push(o.body.data.id);

    const oid = o.body.data.id;
    check('nace sin completar', o.body.data.completado, false);

    const marcado = await call('PATCH', `/api/estudio/objetivos/${oid}`, { completado: true });
    check('marcar como hecho', marcado.body.data.completado, true);
    check('guarda la fecha de completado', marcado.body.data.fecha_completado !== null, true);

    const desmarcado = await call('PATCH', `/api/estudio/objetivos/${oid}`, { completado: false });
    check('desmarcar limpia la fecha', desmarcado.body.data.fecha_completado, null);
    check('desmarcar conserva el texto', desmarcado.body.data.texto, '[qa] Repasar mitosis');

    const pom = await call('POST', `/api/estudio/objetivos/${oid}/pomodoro`);
    check('sumar un pomodoro', pom.body.data.pomodoros_hechos, 1);

    check('objetivo ajeno da 404', (await call('PATCH', '/api/estudio/objetivos/99999999', { completado: true })).status, 404);
    check('objetivo sin texto da 400', (await call('POST', '/api/estudio/objetivos', {})).status, 400);

    // ── Sesiones ───────────────────────────
    console.log('\n── SESIONES POMODORO ──');
    const s = await call('POST', '/api/estudio/sesiones', { foco: '[qa] Biología', ciclos_completados: 4, minutos_enfoque: 100 });
    check('registrar sesion', s.status, 201);
    check('guarda los ciclos', s.body.data.ciclos_completados, 4);

    const abusiva = await call('POST', '/api/estudio/sesiones', { foco: '[qa]', ciclos_completados: 9999, minutos_enfoque: 999999 });
    check('acota ciclos inflados (50)', abusiva.body.data.ciclos_completados, 50);
    check('acota minutos inflados (1440)', abusiva.body.data.minutos_enfoque, 1440);

    // ── Mazos y tarjetas ───────────────────
    console.log('\n── FLASHCARDS ──');
    const m = await call('POST', '/api/mazos', { nombre: '[qa] Biología', descripcion: 'prueba' });
    check('crear mazo', m.status, 201);
    const mazoId = m.body.data.id;
    creado.mazos.push(mazoId);

    const t1 = await call('POST', `/api/mazos/${mazoId}/tarjetas`, { frente: '¿Qué es la mitosis?', reverso: 'División celular' });
    check('crear tarjeta', t1.status, 201);
    const tarjetaId = t1.body.data.id;
    check('la tarjeta nace vencida (entra al repaso de hoy)', t1.body.data.repeticiones, 0);

    await call('POST', `/api/mazos/${mazoId}/tarjetas`, { frente: '[qa] 2+2', reverso: '4' });

    const lista = await call('GET', '/api/mazos');
    const mazoEnLista = lista.body.data.find((x) => x.id === mazoId);
    check('el mazo cuenta sus tarjetas', mazoEnLista.total_tarjetas, 2);
    check('las cuenta como pendientes de hoy', mazoEnLista.pendientes, 2);

    const pendientes = await call('GET', '/api/mazos/repaso');
    check('el repaso las devuelve', pendientes.body.data.filter((x) => x.mazo_id === mazoId).length, 2);

    const rep = await call('POST', `/api/mazos/tarjetas/${tarjetaId}/repaso`, { calidad: 4 });
    check('registrar repaso "bien"', rep.status, 200);
    check('primer intervalo = 1 dia', rep.body.data.intervalo_dias, 1);
    check('ya no vence hoy', new Date(rep.body.data.proximo_repaso) > new Date(), true);

    const rep2 = await call('POST', `/api/mazos/tarjetas/${tarjetaId}/repaso`, { calidad: 4 });
    check('segundo repaso = 6 dias', rep2.body.data.intervalo_dias, 6);

    const trasRepaso = await call('GET', '/api/mazos');
    check('pendientes bajan a 1', trasRepaso.body.data.find((x) => x.id === mazoId).pendientes, 1);

    check('calidad invalida da 400', (await call('POST', `/api/mazos/tarjetas/${tarjetaId}/repaso`, { calidad: 42 })).status, 400);
    check('tarjeta ajena da 404', (await call('POST', '/api/mazos/tarjetas/99999999/repaso', { calidad: 4 })).status, 404);
    check('tarjeta en mazo ajeno da 404', (await call('POST', '/api/mazos/99999999/tarjetas', { frente: 'x', reverso: 'y' })).status, 404);

    // ── Mapas conceptuales ─────────────────
    console.log('\n── MAPAS CONCEPTUALES ──');
    const mapa = await call('POST', '/api/mapas', {
      titulo: '[qa] Revolución Francesa',
      datos: {
        nodos: [
          { id: 'a', texto: 'Revolución', x: 0, y: 0, tipo: 'principal' },
          { id: 'b', texto: 'Causas', x: 100, y: 50, tipo: 'secundario' },
        ],
        conexiones: [
          { de: 'a', a: 'b', etiqueta: 'tiene' },
          { de: 'a', a: 'fantasma', etiqueta: 'colgada' },
          { de: 'a', a: 'a', etiqueta: 'a si mismo' },
        ],
      },
    });
    check('crear mapa', mapa.status, 201);
    const mapaId = mapa.body.data.id;
    creado.mapas.push(mapaId);
    check('descarta la conexion a un nodo inexistente y el bucle', mapa.body.data.datos.conexiones.length, 1);
    check('conserva la conexion valida', mapa.body.data.datos.conexiones[0].de, 'a');

    const listaMapas = await call('GET', '/api/mapas');
    const mapaEnLista = listaMapas.body.data.find((x) => x.id === mapaId);
    check('el listado no manda el grafo entero', mapaEnLista.datos, undefined);
    check('pero si el conteo de nodos', mapaEnLista.cantidad_nodos, 2);

    const nodosDeMas = { nodos: Array.from({ length: 250 }, (_, i) => ({ id: String(i), texto: 't' })), conexiones: [] };
    check('rechaza un mapa de 250 nodos', (await call('POST', '/api/mapas', { titulo: '[qa] grande', datos: nodosDeMas })).status, 400);

    // ── Apuntes con plantilla ──────────────
    console.log('\n── APUNTES CON PLANTILLA ──');
    const cornell = await call('POST', '/api/apuntes', {
      titulo: '[qa] Cornell',
      contenido: 'apuntes de clase',
      plantilla: 'cornell',
      secciones: { palabras_clave: 'mitosis, meiosis', resumen: 'division celular', explicacion: 'no corresponde' },
    });
    check('crear apunte Cornell', cornell.status, 201);
    creado.apuntes.push(cornell.body.data.id);
    check('guarda las secciones de Cornell', cornell.body.data.secciones.palabras_clave, 'mitosis, meiosis');
    check('descarta secciones de otra plantilla', cornell.body.data.secciones.explicacion, undefined);

    const cambiada = await call('PUT', `/api/apuntes/${cornell.body.data.id}`, {
      titulo: '[qa] Feynman',
      contenido: 'x',
      plantilla: 'feynman',
      secciones: { explicacion: 'lo explico simple', lagunas: 'me falta la profase' },
    });
    check('cambiar de plantilla limpia lo viejo', cambiada.body.data.secciones.palabras_clave, undefined);
    check('y guarda lo nuevo', cambiada.body.data.secciones.lagunas, 'me falta la profase');

    const viejo = await call('POST', '/api/apuntes', { titulo: '[qa] libre', contenido: 'sin plantilla' });
    creado.apuntes.push(viejo.body.data.id);
    check('un apunte sin plantilla queda como libre', viejo.body.data.plantilla, 'libre');

    // ── Resumen del hub ────────────────────
    console.log('\n── RESUMEN DEL HUB ──');
    const resumen = await call('GET', '/api/estudio/resumen');
    check('resumen responde 200', resumen.status, 200);
    check('trae 14 dias (incluidos los vacios)', resumen.body.data.por_dia.length, 14);
    check('cuenta las tarjetas pendientes', resumen.body.data.tarjetas_pendientes >= 1, true);
    check('incluye los objetivos', Array.isArray(resumen.body.data.objetivos), true);
    check('incluye la racha', typeof resumen.body.data.racha, 'number');
    check('minutos de hoy > 0 tras la sesion', resumen.body.data.totales.minutos_hoy > 0, true);

    // ── Aislamiento entre alumnos ──────────
    console.log('\n── AISLAMIENTO ──');
    const tokenOtro = jwt.sign({ rol: 'ALUMNO', alumno_id: 999999, institucion_id }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const otro = await fetch(`${BASE}/api/mazos`, { headers: { authorization: `Bearer ${tokenOtro}` } });
    const mazosOtro = (await otro.json()).data;
    check('otro alumno no ve este mazo', mazosOtro.some((x) => x.id === mazoId), false);

    const tokenProfe = jwt.sign({ rol: 'PROFESOR', institucion_id }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const profe = await fetch(`${BASE}/api/mazos`, { headers: { authorization: `Bearer ${tokenProfe}` } });
    check('un profesor no accede a la zona de estudio', profe.status, 403);
    check('sin token da 401', (await fetch(`${BASE}/api/estudio/resumen`)).status, 401);
  } finally {
    console.log('\n── LIMPIEZA ──');
    const { default: pool } = await import('../src/database/db.js');
    for (const id of creado.mazos) await pool.query('DELETE FROM mazo WHERE id = $1', [id]);
    for (const id of creado.mapas) await pool.query('DELETE FROM mapa_conceptual WHERE id = $1', [id]);
    for (const id of creado.apuntes) await pool.query('DELETE FROM apunte WHERE id = $1', [id]);
    await pool.query("DELETE FROM estudio_objetivo WHERE texto LIKE '[qa]%'");
    await pool.query("DELETE FROM estudio_sesion WHERE foco LIKE '[qa]%'");

    const resto = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM mazo WHERE nombre LIKE '[qa]%') AS mazos,
        (SELECT COUNT(*)::int FROM mapa_conceptual WHERE titulo LIKE '[qa]%') AS mapas,
        (SELECT COUNT(*)::int FROM apunte WHERE titulo LIKE '[qa]%') AS apuntes,
        (SELECT COUNT(*)::int FROM estudio_objetivo WHERE texto LIKE '[qa]%') AS objetivos,
        (SELECT COUNT(*)::int FROM estudio_sesion WHERE foco LIKE '[qa]%') AS sesiones
    `);
    console.log('Residuo de prueba en la base:', JSON.stringify(resto.rows[0]));
  }

  console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} FALLOS`}`);
  process.exit(fallos ? 1 : 0);
};

main();
