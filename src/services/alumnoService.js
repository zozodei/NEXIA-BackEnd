import AlumnoRepository from '../repositories/alumnoRepository.js';

export default class AlumnoService {
  constructor() {
    this.repo = new AlumnoRepository();
  }

  getAllAsync = async (institucionId) => {
    return await this.repo.getAllAsync(institucionId);
  };

  getByIdAsync = async (id) => {
    return await this.repo.getByIdAsync(id);
  };

  getMateriasConContenidosAsync = async (id) => {
    return await this.repo.getMateriasConContenidosAsync(id);
  };

  getContenidosAsync = async (id, materiaId) => {
    return await this.repo.getContenidosAsync(id, materiaId);
  };
}