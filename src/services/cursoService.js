import CursoRepository from '../repositories/cursoRepository.js';

/**
 * Errores de regla de negocio del módulo de cursos.
 *
 * El controller los traduce a códigos HTTP. Sin esto, el service tendría que
 * devolver `null` para todo y el controller no podría distinguir "no existe"
 * de "ya hay un 3° B" ni de "tiene alumnos anotados".
 */
export class CursoError extends Error {
  constructor(tipo, message) {
    super(message);
    this.name = 'CursoError';
    this.tipo = tipo; // 'duplicado' | 'especialidad' | 'con_dependencias'
  }
}

const ANIO_MIN = 1;
const ANIO_MAX = 7;

export default class CursoService {
  constructor() {
    this.repo = new CursoRepository();
  }

  getAllAsync = async (institucionId) => {
    return await this.repo.getAllAsync(institucionId);
  };

  getByIdAsync = async (id) => {
    return await this.repo.getByIdAsync(id);
  };

  /**
   * Valida y normaliza los datos que llegan del formulario.
   * Devuelve el objeto listo para el repositorio o lanza CursoError.
   */
  #normalizarAsync = async ({ anio, division, especialidad_id }, institucionId, excluirId = null) => {
    const anioNum = Number(anio);

    if (!Number.isInteger(anioNum) || anioNum < ANIO_MIN || anioNum > ANIO_MAX) {
      throw new CursoError('validacion', `El año debe ser un número entero entre ${ANIO_MIN} y ${ANIO_MAX}`);
    }

    const divisionLimpia = String(division ?? '').trim();

    if (divisionLimpia.length === 0 || divisionLimpia.length > 10) {
      throw new CursoError('validacion', 'La división es obligatoria y admite hasta 10 caracteres');
    }

    // La especialidad es opcional, pero si viene tiene que ser de la misma
    // institución: si no, un gestor podría colgar su curso de la especialidad
    // de otro colegio y el listado de materias saldría cruzado.
    let especialidadId = null;

    if (especialidad_id !== undefined && especialidad_id !== null && especialidad_id !== '') {
      especialidadId = Number(especialidad_id);
      const valida = await this.repo.especialidadPerteneceAsync(especialidadId, institucionId);

      if (!valida) {
        throw new CursoError('especialidad', 'La especialidad no pertenece a tu institución');
      }
    }

    const duplicado = await this.repo.existeAnioDivisionAsync(
      institucionId,
      anioNum,
      divisionLimpia,
      excluirId
    );

    if (duplicado) {
      throw new CursoError('duplicado', `Ya existe el curso ${anioNum}° ${divisionLimpia} en tu institución`);
    }

    return { anio: anioNum, division: divisionLimpia, especialidad_id: especialidadId };
  };

  createAsync = async (institucionId, data) => {
    const limpio = await this.#normalizarAsync(data, institucionId);
    return await this.repo.createAsync({ ...limpio, institucion_id: institucionId });
  };

  updateAsync = async (id, institucionId, data) => {
    const limpio = await this.#normalizarAsync(data, institucionId, id);
    return await this.repo.updateAsync(id, institucionId, limpio);
  };

  deleteAsync = async (id, institucionId) => {
    // Se corta antes del DELETE: borrar un curso con alumnos los dejaría sin
    // curso (o los arrastraría por cascada). El gestor tiene que reubicarlos
    // primero, y el mensaje se lo dice con los números concretos.
    const { alumnos, materias } = await this.repo.getDependenciasAsync(id);

    if (alumnos > 0 || materias > 0) {
      const partes = [];
      if (alumnos > 0) partes.push(`${alumnos} alumno${alumnos === 1 ? '' : 's'}`);
      if (materias > 0) partes.push(`${materias} materia${materias === 1 ? '' : 's'} asignada${materias === 1 ? '' : 's'}`);

      throw new CursoError(
        'con_dependencias',
        `No se puede eliminar: el curso tiene ${partes.join(' y ')}.`
      );
    }

    return await this.repo.deleteAsync(id, institucionId);
  };
}
