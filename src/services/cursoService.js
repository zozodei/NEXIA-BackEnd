import CursoRepository from '../repositories/cursoRepository.js';

export default class CursoService {
  constructor() {
    this.repo = new CursoRepository();
  }

  getAllAsync = async (institucionId) => {
    return await this.repo.getAllAsync(institucionId);
  };
}