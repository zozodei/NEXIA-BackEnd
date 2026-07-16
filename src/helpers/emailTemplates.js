/* ─────────────────────────────────────────────
   PLANTILLAS DE EMAIL — HTML de marca NEXIA.
   Cada builder devuelve { subject, html, text }.
   HTML pensado para clientes de correo: estilos
   inline, tablas, colores de la marca (navy/orange).
───────────────────────────────────────────── */

const NAVY = '#1A237E';
const NAVY_D = '#0D1654';
const ORANGE = '#FF9800';
const TEXTO = '#1E2C4A';
const TEXTO_3 = '#5B6C8A';
const BORDE = '#E2E5F0';
const FONDO = '#F2F3FB';

const appUrl = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

const escapar = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Envoltorio común: header de marca + tarjeta + footer. */
function layout({ preheader = '', titulo, cuerpo, cta }) {
  const botonCta = cta
    ? `<tr><td style="padding:8px 0 4px;">
         <a href="${cta.url}" style="display:inline-block;background:${ORANGE};color:${NAVY_D};
            font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:10px;">
           ${escapar(cta.label)}
         </a>
       </td></tr>`
    : '';

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:${FONDO};font-family:'Segoe UI',Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapar(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FONDO};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDE};border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:linear-gradient(135deg,${NAVY_D},${NAVY});padding:26px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.5px;">NEXIA</span>
          <span style="color:${ORANGE};font-size:20px;font-weight:800;">.</span>
        </td>
      </tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:${NAVY};line-height:1.3;">${escapar(titulo)}</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="font-size:15px;color:${TEXTO};line-height:1.65;">
          ${cuerpo}
          ${botonCta}
        </table>
      </td></tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid ${BORDE};">
          <p style="margin:0;font-size:12px;color:${TEXTO_3};line-height:1.6;">
            Recibís este correo porque tenés activadas las notificaciones por email en NEXIA.
            Podés desactivarlas en <strong>Configuración</strong> dentro de la plataforma.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const parrafo = (texto) =>
  `<tr><td style="padding:0 0 14px;">${texto}</td></tr>`;

/** Fila destacada (nota, materia, etc.) tipo "chip". */
const dato = (etiqueta, valor) =>
  `<tr><td style="padding:0 0 12px;">
     <span style="display:inline-block;background:${FONDO};border:1px solid ${BORDE};border-radius:8px;
        padding:6px 12px;font-size:13px;color:${TEXTO_3};">
       <strong style="color:${TEXTO};">${escapar(etiqueta)}:</strong> ${escapar(valor)}
     </span>
   </td></tr>`;

/* ── Corrección de un TP ── */
export function correccionTp({ nombreAlumno, tituloTp, materia, nota, comentario, tpId }) {
  const cuerpo =
    parrafo(`Hola <strong>${escapar(nombreAlumno)}</strong>, tu entrega ya fue corregida.`) +
    dato('Trabajo práctico', tituloTp) +
    (materia ? dato('Materia', materia) : '') +
    dato('Nota', `${nota} / 10`) +
    (comentario
      ? parrafo(`<strong>Comentario del docente:</strong><br>${escapar(comentario)}`)
      : parrafo('El docente no dejó un comentario adicional.'));

  return {
    subject: `Corrigieron tu entrega: ${tituloTp}`,
    html: layout({
      preheader: `Tu nota en "${tituloTp}" ya está disponible`,
      titulo: 'Tu entrega fue corregida',
      cuerpo,
      cta: tpId ? { label: 'Ver la corrección', url: `${appUrl()}/trabajo-practico/${tpId}` } : null,
    }),
    text:
      `Hola ${nombreAlumno}, tu entrega fue corregida.\n` +
      `Trabajo práctico: ${tituloTp}\n` +
      (materia ? `Materia: ${materia}\n` : '') +
      `Nota: ${nota}/10\n` +
      (comentario ? `Comentario: ${comentario}\n` : ''),
  };
}

/* ── Nuevo TP publicado ── */
export function nuevoTp({ nombreAlumno, tituloTp, materia, fechaLimite, profesor, tpId }) {
  const limite = fechaLimite
    ? new Date(fechaLimite).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const cuerpo =
    parrafo(`Hola <strong>${escapar(nombreAlumno)}</strong>, se publicó un nuevo trabajo práctico.`) +
    dato('Trabajo práctico', tituloTp) +
    (materia ? dato('Materia', materia) : '') +
    (profesor ? dato('Docente', profesor) : '') +
    (limite ? dato('Fecha límite', limite) : parrafo('Sin fecha límite definida.'));

  return {
    subject: `Nuevo trabajo práctico: ${tituloTp}`,
    html: layout({
      preheader: `${materia || 'Tu materia'} tiene un nuevo trabajo práctico`,
      titulo: 'Nuevo trabajo práctico',
      cuerpo,
      cta: tpId ? { label: 'Ver el trabajo práctico', url: `${appUrl()}/trabajo-practico/${tpId}` } : null,
    }),
    text:
      `Hola ${nombreAlumno}, se publicó un nuevo trabajo práctico.\n` +
      `Trabajo práctico: ${tituloTp}\n` +
      (materia ? `Materia: ${materia}\n` : '') +
      (profesor ? `Docente: ${profesor}\n` : '') +
      (limite ? `Fecha límite: ${limite}\n` : ''),
  };
}

/* ── Nuevo comunicado institucional ── */
export function nuevoComunicado({ nombre, titulo, contenido, institucion }) {
  const extracto = contenido && contenido.length > 320 ? `${contenido.slice(0, 320)}…` : contenido;

  const cuerpo =
    parrafo(`Hola <strong>${escapar(nombre)}</strong>, ${escapar(institucion || 'tu institución')} publicó un comunicado.`) +
    parrafo(`<strong style="font-size:16px;color:${NAVY};">${escapar(titulo)}</strong>`) +
    (extracto ? parrafo(escapar(extracto).replace(/\n/g, '<br>')) : '');

  return {
    subject: `Comunicado: ${titulo}`,
    html: layout({
      preheader: titulo,
      titulo: 'Nuevo comunicado',
      cuerpo,
      cta: { label: 'Ver comunicados', url: `${appUrl()}/comunicados` },
    }),
    text:
      `Hola ${nombre}, ${institucion || 'tu institución'} publicó un comunicado.\n\n` +
      `${titulo}\n${extracto || ''}\n`,
  };
}
