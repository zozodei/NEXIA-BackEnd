import { Router } from 'express';
import MateriaService from '../services/materiaService.js';
import { ok, serverError } from '../helpers/responseHelper.js';

const router = Router();
const service = new MateriaService();

router.get('/', async (req, res) => {
  try {
    const data = await service.getAllAsync(req.query.institucion_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;