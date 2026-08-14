import EspecialidadRepository from '../repositories/especialidadRepository.js';

export default class EspecialidadService {
  constructor() {
    this.repo = new EspecialidadRepository();
  }

  getAllByInstitucionAsync = async (institucionId) => {
    return await this.repo.getAllByInstitucionAsync(institucionId);
  };
}
