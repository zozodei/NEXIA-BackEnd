import EventoRepository from '../repositories/eventoRepository.js';

export default class EventoService {
  constructor() {
    this.repo = new EventoRepository();
  }

  getByInstitucionAsync = async (institucion_id) => {
    return await this.repo.getByInstitucionAsync(institucion_id);
  };

  createAsync = async (data) => {
    return await this.repo.createAsync(data);
  };

  deleteAsync = async (id, institucion_id) => {
    return await this.repo.deleteAsync(id, institucion_id);
  };
}
