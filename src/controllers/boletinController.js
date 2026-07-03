import { Router } from 'express';
import BoletinService from '../services/boletinService.js';
import { ok, forbidden, serverError } from '../helpers/responseHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();
const service = new BoletinService();

// Boletín completo de un alumno: notas finales por materia/bimestre + detalle de notas de TP
router.get('/alumno/:alumnoId', verifyToken, async (req, res) => {
  try {
    const { rol, alumno_id } = req.user;

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.alumnoId) {
      return forbidden(res, 'Solo podés ver tu propio boletín');
    }

    if (!['GESTOR', 'DIRECTIVO', 'ALUMNO'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getBoletinAlumnoAsync(req.params.alumnoId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
