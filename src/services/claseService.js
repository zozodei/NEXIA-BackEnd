import ClaseRepository from '../repositories/claseRepository.js';
import AsistenciaRepository from '../repositories/asistenciaRepository.js';

export default class ClaseService {
  constructor() {
    this.repo = new ClaseRepository();
    this.asistenciaRepo = new AsistenciaRepository();
  }

  getDetallePcmAsync = async (pcmId) => {
    return await this.repo.getDetallePcmAsync(pcmId);
  };

  getOrCreateAsync = async (data) => {
    return await this.repo.getOrCreateAsync(data);
  };

  getByIdAsync = async (id) => {
    return await this.repo.getByIdAsync(id);
  };

  updateAsync = async (id, data) => {
    return await this.repo.updateAsync(id, data);
  };

  cerrarAsync = async (id) => {
    return await this.repo.cerrarAsync(id);
  };

  getByProfeCursoMateriaAsync = async (pcmId) => {
    return await this.repo.getByProfeCursoMateriaAsync(pcmId);
  };

  getGrillaAsync = async (claseId) => {
    return await this.asistenciaRepo.getGrillaAsync(claseId);
  };

  // Guarda/edita el estado de cada alumno de la lista; ignora alumnos que no pertenezcan al curso de la clase
  guardarListaAsync = async (claseId, alumnos, profesorId) => {
    const roster = await this.asistenciaRepo.getGrillaAsync(claseId);
    const idsDelCurso = new Set(roster.map((a) => String(a.alumno_id)));

    const resultados = [];

    for (const alumno of alumnos) {
      if (!idsDelCurso.has(String(alumno.alumno_id))) continue;

      const registro = await this.asistenciaRepo.upsertAsync({
        clase_id: claseId,
        alumno_id: alumno.alumno_id,
        estado: alumno.estado,
        observaciones: alumno.observaciones,
        registrado_por: profesorId
      });

      resultados.push(registro);
    }

    return resultados;
  };
}
