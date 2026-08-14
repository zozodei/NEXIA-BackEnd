import EstudioRepository from '../repositories/estudioRepository.js';
import MazoRepository from '../repositories/mazoRepository.js';
import MapaRepository from '../repositories/mapaRepository.js';

/* Zona de estudio — sesiones Pomodoro, objetivos y el resumen del hub. */

export default class EstudioService {
  constructor() {
    this.repo = new EstudioRepository();
    this.mazos = new MazoRepository();
    this.mapas = new MapaRepository();
  }

  // ── Sesiones ──────────────────────────────

  registrarSesionAsync = async (alumnoId, data) => {
    // Se acotan los valores que llegan del cliente: el frontend cuenta los
    // ciclos en memoria y una pestaña abierta toda la noche, o un reloj de
    // sistema cambiado, podrían inflar las estadísticas sin querer.
    return await this.repo.registrarSesionAsync(alumnoId, {
      foco: String(data.foco ?? '').slice(0, 200),
      ciclos_completados: Math.min(Math.max(Number(data.ciclos_completados) || 0, 0), 50),
      minutos_enfoque: Math.min(Math.max(Number(data.minutos_enfoque) || 0, 0), 24 * 60),
    });
  };

  /** Todo lo que el hub necesita para pintarse, en una sola llamada. */
  getResumenAsync = async (alumnoId) => {
    const [porDia, totales, racha, tarjetasPendientes, objetivos, mapas] = await Promise.all([
      this.repo.getResumenAsync(alumnoId, 14),
      this.repo.getTotalesAsync(alumnoId),
      this.repo.getRachaAsync(alumnoId),
      this.mazos.contarPendientesAsync(alumnoId),
      this.repo.getObjetivosAsync(alumnoId),
      this.mapas.contarAsync(alumnoId),
    ]);

    return {
      por_dia: porDia,
      totales,
      racha,
      tarjetas_pendientes: tarjetasPendientes,
      objetivos,
      mapas_total: mapas,
    };
  };

  // ── Objetivos ─────────────────────────────

  getObjetivosAsync = (alumnoId) => this.repo.getObjetivosAsync(alumnoId);

  crearObjetivoAsync = (alumnoId, data) =>
    this.repo.crearObjetivoAsync(alumnoId, {
      texto: String(data.texto).trim().slice(0, 300),
      pomodoros_estimados: data.pomodoros_estimados,
    });

  actualizarObjetivoAsync = (id, alumnoId, data) =>
    this.repo.actualizarObjetivoAsync(id, alumnoId, {
      texto: data.texto !== undefined ? String(data.texto).trim().slice(0, 300) : undefined,
      completado: data.completado,
      pomodoros_estimados: data.pomodoros_estimados,
    });

  sumarPomodoroAsync = (id, alumnoId) => this.repo.sumarPomodoroAsync(id, alumnoId);
  eliminarObjetivoAsync = (id, alumnoId) => this.repo.eliminarObjetivoAsync(id, alumnoId);
  eliminarCompletadosAsync = (alumnoId) => this.repo.eliminarCompletadosAsync(alumnoId);
}
