import { Router } from 'express';
import MapaService, { MapaError } from '../services/mapaService.js';
import { ok, created, badRequest, notFound, serverError } from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

/* Mapas conceptuales — privados del alumno. */

const router = Router();
const service = new MapaService();
const soloAlumno = [verifyToken, requireRoles('ALUMNO')];

const handleError = (res, error) => {
  if (error instanceof MapaError) {
    return badRequest(res, error.message);
  }
  return serverError(res, error);
};

router.get('/', soloAlumno, async (req, res) => {
  try {
    const data = await service.getTodosAsync(req.user.alumno_id);
    return ok(res, data);
  } catch (error) {
    return handleError(res, error);
  }
});

router.get('/:id', soloAlumno, async (req, res) => {
  try {
    const data = await service.getPorIdAsync(req.params.id, req.user.alumno_id);

    if (!data) {
      return notFound(res, 'Mapa no encontrado');
    }

    return ok(res, data);
  } catch (error) {
    return handleError(res, error);
  }
});

router.post('/', soloAlumno, async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['titulo']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.crearAsync(req.user.alumno_id, req.body);
    return created(res, data, 'Mapa creado');
  } catch (error) {
    return handleError(res, error);
  }
});

router.put('/:id', soloAlumno, async (req, res) => {
  try {
    const data = await service.actualizarAsync(req.params.id, req.user.alumno_id, req.body);

    if (!data) {
      return notFound(res, 'Mapa no encontrado');
    }

    return ok(res, data, 'Mapa guardado');
  } catch (error) {
    return handleError(res, error);
  }
});

router.delete('/:id', soloAlumno, async (req, res) => {
  try {
    const data = await service.eliminarAsync(req.params.id, req.user.alumno_id);

    if (!data) {
      return notFound(res, 'Mapa no encontrado');
    }

    return ok(res, data, 'Mapa eliminado');
  } catch (error) {
    return handleError(res, error);
  }
});

export default router;
