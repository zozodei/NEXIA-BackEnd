import BimestreRepository from '../repositories/bimestreRepository.js';

export default class BimestreService {
  constructor() {
    this.repo = new BimestreRepository();
  }

  createAsync = async (data) => {
    return await this.repo.createAsync(data);
  };

  getByInstitucionAsync = async (institucionId) => {
    return await this.repo.getByInstitucionAsync(institucionId);
  };

  getByIdAsync = async (id) => {
    return await this.repo.getByIdAsync(id);
  };
}
