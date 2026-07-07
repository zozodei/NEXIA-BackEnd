import ComunicadoRepository from '../repositories/comunicadoRepository.js';

export default class ComunicadoService {
  constructor() {
    this.repo = new ComunicadoRepository();
  }

  createAsync = async (data) => {
    return await this.repo.createAsync(data);
  };

  updateAsync = async (id, institucion_id, data) => {
    return await this.repo.updateAsync(id, institucion_id, data);
  };

  deleteAsync = async (id, institucion_id) => {
    return await this.repo.deleteAsync(id, institucion_id);
  };

  getAllByInstitucionAsync = async (institucion_id) => {
    return await this.repo.getAllByInstitucionAsync(institucion_id);
  };
}
