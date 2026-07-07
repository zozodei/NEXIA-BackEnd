import ApunteRepository from '../repositories/apunteRepository.js';

export default class ApunteService {
  constructor() {
    this.repo = new ApunteRepository();
  }

  getByAlumnoAsync = async (alumno_id) => {
    return await this.repo.getByAlumnoAsync(alumno_id);
  };

  createAsync = async (alumno_id, data) => {
    return await this.repo.createAsync(alumno_id, data);
  };

  updateAsync = async (id, alumno_id, data) => {
    return await this.repo.updateAsync(id, alumno_id, data);
  };

  deleteAsync = async (id, alumno_id) => {
    return await this.repo.deleteAsync(id, alumno_id);
  };
}
