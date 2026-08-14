import { Router } from 'express';
import EspecialidadService from '../services/especialidadService.js';
import { ok, serverError } from '../helpers/responseHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();
const service = new EspecialidadService();

// Las especialidades alimentan el alta de cursos del gestor. Igual que
// cursos y materias, el listado sale acotado a la institución del token.
router.get('/', verifyToken, async (req, res) => {
  try {
    const institucionId = req.user.institucion_id ?? req.query.institucion_id;
    const data = await service.getAllByInstitucionAsync(institucionId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
