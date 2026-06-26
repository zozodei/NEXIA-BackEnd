import ComunicadoRepository from '../repositories/comunicadoRepository.js';

export default class ComunicadoService {
  constructor() {
    this.repo = new ComunicadoRepository();
  }

  createAsync = async (data) => {
    return await this.repo.createAsync(data);
  };

  getAllByInstitucionAsync = async (institucion_id) => {
    return await this.repo.getAllByInstitucionAsync(institucion_id);
  };
}
