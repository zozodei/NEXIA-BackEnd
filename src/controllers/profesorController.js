import { Router } from 'express';
import ProfesorService from '../services/profesorService.js';
import { ok, notFound, serverError } from '../helpers/responseHelper.js';

const router = Router();
const service = new ProfesorService();

router.get('/', async (req, res) => {
  try {
    const data = await service.getAllAsync(req.query.institucion_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await service.getByIdAsync(req.params.id);

    if (!data) {
      return notFound(res, 'Profesor no encontrado');
    }

    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.get('/:id/materias', async (req, res) => {
  try {
    const data = await service.getMateriasAsync(req.params.id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;