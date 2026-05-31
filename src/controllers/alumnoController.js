import { Router } from 'express';
import AlumnoService from '../services/alumnoService.js';
import { ok, notFound, serverError } from '../helpers/responseHelper.js';

const router = Router();
const service = new AlumnoService();

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
      return notFound(res, 'Alumno no encontrado');
    }

    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.get('/:id/materias', async (req, res) => {
  try {
    const data = await service.getMateriasConContenidosAsync(req.params.id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.get('/:id/contenidos', async (req, res) => {
  try {
    const data = await service.getContenidosAsync(
      req.params.id,
      req.query.materia_id
    );

    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;