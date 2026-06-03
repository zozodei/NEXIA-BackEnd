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

  getByProfeCursoMateriaAsync = async (profeCursoMateriaId) => {
    const detalle = await this.repo.getDetalleProfeCursoMateriaAsync(profeCursoMateriaId);

    if (!detalle) {
      return null;
    }

    const contenidos = await this.repo.getByProfeCursoMateriaAsync(profeCursoMateriaId);

    return {
      materia: detalle,
      contenidos
    };
  };
}