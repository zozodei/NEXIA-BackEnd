import ApunteRepository from '../repositories/apunteRepository.js';

/* ─────────────────────────────────────────────
   APUNTES — libres o con plantilla de estudio.

   Cornell y Feynman no son features aparte: son
   dos maneras de estructurar un apunte. Por eso
   viven acá y no en un módulo propio.

   Cornell parte la hoja en tres: palabras clave a
   la izquierda, apuntes a la derecha y un resumen
   abajo. Feynman obliga a explicar el tema con
   palabras simples y a anotar qué partes no
   cerraron, para volver a estudiarlas.
───────────────────────────────────────────── */

/** Qué campos guarda cada plantilla en la columna `secciones`. */
const PLANTILLAS = {
  libre: [],
  cornell: ['palabras_clave', 'resumen'],
  feynman: ['explicacion', 'lagunas'],
};

const LARGO_MAXIMO = 20000;

export default class ApunteService {
  constructor() {
    this.repo = new ApunteRepository();
  }

  /**
   * Deja pasar sólo las secciones que corresponden a la plantilla elegida.
   *
   * Si se guardara el objeto tal como llega, cambiar de Cornell a Feynman
   * dejaría en la base las palabras clave y el resumen viejos, invisibles en
   * la interfaz pero presentes en el dato — y reaparecerían al volver a
   * Cornell con contenido que el alumno creía descartado.
   */
  #normalizar = (data) => {
    const plantilla = PLANTILLAS[data.plantilla] ? data.plantilla : 'libre';
    const permitidas = PLANTILLAS[plantilla];
    const entrada = data.secciones ?? {};

    const secciones = {};
    for (const campo of permitidas) {
      secciones[campo] = String(entrada[campo] ?? '').slice(0, LARGO_MAXIMO);
    }

    return {
      titulo: String(data.titulo ?? '').trim().slice(0, 200),
      contenido: String(data.contenido ?? '').slice(0, LARGO_MAXIMO),
      color: data.color,
      plantilla,
      secciones,
    };
  };

  getByAlumnoAsync = async (alumno_id) => {
    return await this.repo.getByAlumnoAsync(alumno_id);
  };

  createAsync = async (alumno_id, data) => {
    return await this.repo.createAsync(alumno_id, this.#normalizar(data));
  };

  updateAsync = async (id, alumno_id, data) => {
    return await this.repo.updateAsync(id, alumno_id, this.#normalizar(data));
  };

  deleteAsync = async (id, alumno_id) => {
    return await this.repo.deleteAsync(id, alumno_id);
  };
}
