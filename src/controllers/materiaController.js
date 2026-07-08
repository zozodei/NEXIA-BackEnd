import { Router } from 'express';
import MateriaService from '../services/materiaService.js';
import { ok, serverError } from '../helpers/responseHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();
const service = new MateriaService();

router.get('/', verifyToken, async (req, res) => {
  try {
    // Limitado a la institución del token
    const institucionId = req.user.institucion_id ?? req.query.institucion_id;
    const data = await service.getAllAsync(institucionId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
