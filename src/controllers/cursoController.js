import { Router } from 'express';
import CursoService from '../services/cursoService.js';
import { ok, serverError } from '../helpers/responseHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();
const service = new CursoService();

router.get('/', verifyToken, async (req, res) => {
  try {
    // El listado queda limitado a la institución del token:
    // nadie puede enumerar cursos de otra institución
    const institucionId = req.user.institucion_id ?? req.query.institucion_id;
    const data = await service.getAllAsync(institucionId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
