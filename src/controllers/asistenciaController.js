import { Router } from 'express';
import AsistenciaService from '../services/asistenciaService.js';
import { ok, badRequest, forbidden, serverError } from '../helpers/responseHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();
const service = new AsistenciaService();

// Historial de asistencia de un alumno, opcionalmente filtrado por materia (?profe_curso_materia_id=)
router.get('/alumno/:alumnoId', verifyToken, async (req, res) => {
  try {
    const { rol, alumno_id } = req.user;

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.alumnoId) {
      return forbidden(res, 'Solo podés ver tu propia asistencia');
    }

    if (!['GESTOR', 'DIRECTIVO', 'ALUMNO'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getByAlumnoAsync(req.params.alumnoId, req.query.profe_curso_materia_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// Porcentaje de asistencia de un alumno en una materia puntual
router.get('/alumno/:alumnoId/porcentaje', verifyToken, async (req, res) => {
  try {
    const { rol, alumno_id } = req.user;

    if (!req.query.profe_curso_materia_id) {
      return badRequest(res, 'Falta el parámetro profe_curso_materia_id');
    }

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.alumnoId) {
      return forbidden(res, 'Solo podés ver tu propia asistencia');
    }

    if (!['GESTOR', 'DIRECTIVO', 'ALUMNO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getPorcentajeAsync(req.params.alumnoId, req.query.profe_curso_materia_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
