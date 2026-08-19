import AsistenciaRepository from '../repositories/asistenciaRepository.js';

export default class AsistenciaService {
  constructor() {
    this.repo = new AsistenciaRepository();
  }

  getByAlumnoAsync = async (alumnoId, profeCursoMateriaId) => {
    return await this.repo.getByAlumnoAsync(alumnoId, profeCursoMateriaId);
  };

  getPorcentajeAsync = async (alumnoId, profeCursoMateriaId) => {
    return await this.repo.getPorcentajeAsync(alumnoId, profeCursoMateriaId);
  };
}
