import ProfesorRepository from '../repositories/profesorRepository.js';

export default class ProfesorService {
  constructor() {
    this.repo = new ProfesorRepository();
  }

  getAllAsync = async (institucionId) => {
    return await this.repo.getAllAsync(institucionId);
  };

  getByIdAsync = async (id) => {
    return await this.repo.getByIdAsync(id);
  };

  getMateriasAsync = async (id) => {
    return await this.repo.getMateriasAsync(id);
  };
}