import CalificacionRepository from '../repositories/calificacionRepository.js';

export default class CalificacionService {
  constructor() {
    this.repo = new CalificacionRepository();
  }

  getDetallePcmAsync = async (pcmId) => {
    return await this.repo.getDetallePcmAsync(pcmId);
  };

  getAlumnoCursoIdAsync = async (alumnoId) => {
    return await this.repo.getAlumnoCursoIdAsync(alumnoId);
  };

  upsertAsync = async (data) => {
    return await this.repo.upsertAsync(data);
  };

  getByAlumnoAsync = async (alumnoId) => {
    return await this.repo.getByAlumnoAsync(alumnoId);
  };

  getMateriasByAlumnoAsync = async (alumnoId) => {
    return await this.repo.getMateriasByAlumnoAsync(alumnoId);
  };

  getByCursoMateriaAsync = async (cursoMateriaId, bimestreId) => {
    return await this.repo.getByCursoMateriaAsync(cursoMateriaId, bimestreId);
  };
}
