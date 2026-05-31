import MateriaRepository from '../repositories/materiaRepository.js';

export default class MateriaService {
  constructor() {
    this.repo = new MateriaRepository();
  }

  getAllAsync = async (institucionId) => {
    return await this.repo.getAllAsync(institucionId);
  };
}