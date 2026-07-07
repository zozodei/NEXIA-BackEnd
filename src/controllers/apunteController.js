import { Router } from 'express';
import ApunteService from '../services/apunteService.js';
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

/* Apuntes personales — privados de cada alumno.
   El alumno_id sale siempre del token, nunca del body. */

const router = Router();
const service = new ApunteService();

router.get('/', verifyToken, requireRoles('ALUMNO'), async (req, res) => {
  try {
    const data = await service.getByAlumnoAsync(req.user.alumno_id);
    return ok(res, data, 'Apuntes obtenidos correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

router.post('/', verifyToken, requireRoles('ALUMNO'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['titulo']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.createAsync(req.user.alumno_id, req.body);
    return created(res, data, 'Apunte creado correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

router.put('/:id', verifyToken, requireRoles('ALUMNO'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['titulo']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.updateAsync(req.params.id, req.user.alumno_id, req.body);

    if (!data) {
      return notFound(res, 'Apunte no encontrado');
    }

    return ok(res, data, 'Apunte actualizado correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

router.delete('/:id', verifyToken, requireRoles('ALUMNO'), async (req, res) => {
  try {
    const data = await service.deleteAsync(req.params.id, req.user.alumno_id);

    if (!data) {
      return notFound(res, 'Apunte no encontrado');
    }

    return ok(res, data, 'Apunte eliminado correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
