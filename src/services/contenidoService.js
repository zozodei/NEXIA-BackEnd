import ContenidoRepository from '../repositories/contenidoRepository.js';

export default class ContenidoService {
  constructor() {
    this.repo = new ContenidoRepository();
  }

  getAllAsync = async () => {
    return await this.repo.getAllAsync();
  };

  createAsync = async (data) => {
    return await this.repo.createAsync(data);
  };

  getByProfesorAsync = async (profesorId) => {
    return await this.repo.getByProfesorAsync(profesorId);
  };
}