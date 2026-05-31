import GestorRepository from '../repositories/gestorRepository.js';

export default class GestorService {
  constructor() {
    this.repo = new GestorRepository();
  }

  crearGestorAsync = async (data) => {
    return await this.repo.crearGestorAsync(data);
  };

  crearAlumnoAsync = async (data) => {
    return await this.repo.crearAlumnoAsync(data);
  };

  crearProfesorAsync = async (data) => {
    return await this.repo.crearProfesorAsync(data);
  };

  asignarAlumnoACursoAsync = async (alumnoId, cursoId) => {
    return await this.repo.asignarAlumnoACursoAsync(alumnoId, cursoId);
  };

  asignarProfesorAMateriaAsync = async (data) => {
    return await this.repo.asignarProfesorAMateriaAsync(data);
  };
}