import NotificacionRepository from '../repositories/notificacionRepository.js';
import { enviarEmailAsync, emailConfigurado } from './emailService.js';
import {
  correccionTp,
  nuevoTp,
  nuevoComunicado,
} from '../helpers/emailTemplates.js';

/* ─────────────────────────────────────────────
   NOTIFICACIONES — orquesta el envío de emails ante
   eventos de la plataforma (corrección de TP, nuevo
   TP, comunicado).

   Diseño clave: estos métodos NUNCA lanzan. Se llaman
   desde los controllers como "fire-and-forget" (sin
   await), de modo que un fallo de email jamás rompe
   ni demora la operación principal. Todo error se
   registra y se sigue.
───────────────────────────────────────────── */

const nombreCompleto = (d) => `${d.nombre || ''} ${d.apellido || ''}`.trim() || 'alumno/a';

export default class NotificacionService {
  constructor() {
    this.repo = new NotificacionRepository();
  }

  // Envía a una lista de destinatarios en paralelo, sin cortar ante fallos.
  async #enviarLote(destinatarios, construirMensaje, etiqueta) {
    const resultados = await Promise.allSettled(
      destinatarios.map((d) => {
        const { subject, html, text } = construirMensaje(d);
        return enviarEmailAsync({ to: d.email, toNombre: nombreCompleto(d), subject, html, text });
      })
    );

    const fallidos = resultados.filter((r) => r.status === 'rejected');
    if (fallidos.length) {
      console.error(`[notif:${etiqueta}] ${fallidos.length}/${destinatarios.length} fallaron`,
        fallidos[0].reason?.message);
    }
    console.log(`[notif:${etiqueta}] enviados ${destinatarios.length - fallidos.length}/${destinatarios.length}`);
  }

  /* ── Corrección de un TP → email al alumno ── */
  notificarCorreccionTp = async ({ alumnoId, tp, entrega }) => {
    try {
      if (!emailConfigurado()) return;
      const dest = await this.repo.getAlumnoDestinatarioAsync(alumnoId);
      if (!dest) return; // sin email o con notificaciones desactivadas

      const mensaje = correccionTp({
        nombreAlumno: nombreCompleto(dest),
        tituloTp: tp?.titulo,
        materia: tp?.materia_nombre,
        nota: entrega?.nota,
        comentario: entrega?.comentario_correccion,
        tpId: tp?.trabajo_practico_id,
      });
      await enviarEmailAsync({
        to: dest.email,
        toNombre: nombreCompleto(dest),
        ...mensaje,
      });
      console.log(`[notif:correccion-tp] enviado a ${dest.email}`);
    } catch (err) {
      console.error('[notif:correccion-tp] error', err.message);
    }
  };

  /* ── Nuevo TP publicado → email a los alumnos del curso ── */
  notificarNuevoTp = async ({ tp }) => {
    try {
      if (!emailConfigurado()) return;
      if (!tp?.curso_id) return;

      const alumnos = await this.repo.getAlumnosDeCursoAsync(tp.curso_id);
      if (!alumnos.length) return;

      const profesor = `${tp.profesor_nombre || ''} ${tp.profesor_apellido || ''}`.trim();
      await this.#enviarLote(
        alumnos,
        (a) =>
          nuevoTp({
            nombreAlumno: nombreCompleto(a),
            tituloTp: tp.titulo,
            materia: tp.materia_nombre,
            fechaLimite: tp.fecha_limite,
            profesor,
            tpId: tp.trabajo_practico_id,
          }),
        'nuevo-tp'
      );
    } catch (err) {
      console.error('[notif:nuevo-tp] error', err.message);
    }
  };

  /* ── Nuevo comunicado → email a la institución ── */
  notificarComunicado = async ({ comunicado, institucionNombre }) => {
    try {
      if (!emailConfigurado()) return;
      if (!comunicado?.institucion_id) return;

      const usuarios = await this.repo.getUsuariosDeInstitucionAsync(comunicado.institucion_id);
      if (!usuarios.length) return;

      await this.#enviarLote(
        usuarios,
        (u) =>
          nuevoComunicado({
            nombre: nombreCompleto(u),
            titulo: comunicado.titulo,
            contenido: comunicado.contenido,
            institucion: institucionNombre,
          }),
        'comunicado'
      );
    } catch (err) {
      console.error('[notif:comunicado] error', err.message);
    }
  };
}
