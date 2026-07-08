import GestorRepository from '../repositories/gestorRepository.js';

export default class GestorService {
  constructor() {
    this.repo = new GestorRepository();
  }

  crearGestorAsync = async (data) => {
    return await this.repo.crearGestorAsync(data);
  };

  institucionTieneGestorAsync = async (institucion_id) => {
    return await this.repo.institucionTieneGestorAsync(institucion_id);
  };

  profesorPerteneceAInstitucionAsync = async (profesor_id, institucion_id) => {
    return await this.repo.profesorPerteneceAInstitucionAsync(profesor_id, institucion_id);
  };

  cursoPerteneceAInstitucionAsync = async (curso_id, institucion_id) => {
    return await this.repo.cursoPerteneceAInstitucionAsync(curso_id, institucion_id);
  };

  alumnoPerteneceAInstitucionAsync = async (alumno_id, institucion_id) => {
    return await this.repo.alumnoPerteneceAInstitucionAsync(alumno_id, institucion_id);
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