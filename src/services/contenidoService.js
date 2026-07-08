import ContenidoRepository from '../repositories/contenidoRepository.js';

export default class ContenidoService {
  constructor() {
    this.repo = new ContenidoRepository();
  }

  getAllAsync = async (institucionId = null) => {
    return await this.repo.getAllAsync(institucionId);
  };

  createAsync = async (data) => {
    return await this.repo.createAsync(data);
  };

  updateAsync = async (id, data) => {
    return await this.repo.updateAsync(id, data);
  };

  getByProfesorAsync = async (profesorId) => {
    return await this.repo.getByProfesorAsync(profesorId);
  };

  getDetallePcmAsync = async (profeCursoMateriaId) => {
    return await this.repo.getDetalleProfeCursoMateriaAsync(profeCursoMateriaId);
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

  getByIdAsync = async (contenidoId) => {
    return await this.repo.getByIdAsync(contenidoId);
  };
}