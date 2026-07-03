import CalificacionService from './calificacionService.js';
import TrabajoPracticoService from './trabajoPracticoService.js';

export default class BoletinService {
  constructor() {
    this.calificacionService = new CalificacionService();
    this.trabajoPracticoService = new TrabajoPracticoService();
  }

  getBoletinAlumnoAsync = async (alumnoId) => {
    const [notasFinales, notasTp] = await Promise.all([
      this.calificacionService.getByAlumnoAsync(alumnoId),
      this.trabajoPracticoService.getNotasByAlumnoAsync(alumnoId)
    ]);

    return {
      notas_finales: notasFinales,
      notas_trabajos_practicos: notasTp
    };
  };
}
