import TrabajoPracticoRepository from '../repositories/trabajoPracticoRepository.js';
import EntregaRepository from '../repositories/entregaRepository.js';

export default class TrabajoPracticoService {
  constructor() {
    this.repo = new TrabajoPracticoRepository();
    this.entregaRepo = new EntregaRepository();
  }

  getDetallePcmAsync = async (pcmId) => {
    return await this.repo.getDetallePcmAsync(pcmId);
  };

  createAsync = async (data) => {
    return await this.repo.createAsync(data);
  };

  updateAsync = async (id, data) => {
    return await this.repo.updateAsync(id, data);
  };

  setEstadoAsync = async (id, activo) => {
    return await this.repo.setEstadoAsync(id, activo);
  };

  getByIdAsync = async (id) => {
    return await this.repo.getByIdAsync(id);
  };

  getByProfeCursoMateriaAsync = async (pcmId, opts) => {
    return await this.repo.getByProfeCursoMateriaAsync(pcmId, opts);
  };

  getByAlumnoAsync = async (alumnoId) => {
    return await this.repo.getByAlumnoAsync(alumnoId);
  };

  getEntregasConNotasAsync = async (tpId) => {
    return await this.repo.getEntregasConNotasAsync(tpId);
  };

  getNotasByAlumnoAsync = async (alumnoId) => {
    return await this.repo.getNotasByAlumnoAsync(alumnoId);
  };

  getEntregaAlumnoAsync = async (tpId, alumnoId) => {
    return await this.entregaRepo.getByAlumnoYTpAsync(tpId, alumnoId);
  };

  // Devuelve { error } si no se puede entregar, o { entrega } si se guardó
  crearEntregaAsync = async ({ trabajo_practico_id, alumno_id, archivo_url, comentario_alumno }) => {
    const tp = await this.repo.getByIdAsync(trabajo_practico_id);

    if (!tp) {
      return { error: 'NOT_FOUND' };
    }

    if (!tp.activo) {
      return { error: 'NO_PUBLICADO' };
    }

    if (tp.fecha_limite && new Date() > new Date(tp.fecha_limite)) {
      return { error: 'FUERA_DE_TERMINO' };
    }

    const existente = await this.entregaRepo.getByAlumnoYTpAsync(trabajo_practico_id, alumno_id);

    if (existente && existente.estado === 'corregido') {
      return { error: 'YA_CORREGIDO' };
    }

    const entrega = await this.entregaRepo.upsertAsync({
      trabajo_practico_id,
      alumno_id,
      archivo_url,
      comentario_alumno
    });

    return { entrega };
  };

  // Devuelve null si el alumno todavía no entregó nada
  calificarAsync = async ({ trabajo_practico_id, alumno_id, nota, comentario_correccion }) => {
    const existente = await this.entregaRepo.getByAlumnoYTpAsync(trabajo_practico_id, alumno_id);

    if (!existente) {
      return null;
    }

    return await this.entregaRepo.calificarAsync({
      trabajo_practico_id,
      alumno_id,
      nota,
      comentario_correccion
    });
  };
}
