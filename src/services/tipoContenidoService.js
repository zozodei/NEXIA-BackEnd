import TipoContenidoRepository from '../repositories/tipoContenidoRepository.js';

export default class TipoContenidoService {
  constructor() {
    this.repo = new TipoContenidoRepository();
  }

  getAllAsync = async () => {
    return await this.repo.getAllAsync();
  };

  createAsync = async (data) => {
    return await this.repo.createAsync(data);
  };
}