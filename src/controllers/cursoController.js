import { Router } from 'express';
import CursoService, { CursoError } from '../services/cursoService.js';
import {
  ok,
  created,
  badRequest,
  notFound,
  conflict,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

const router = Router();
const service = new CursoService();

/** Traduce los errores de negocio del service al código HTTP que corresponde. */
const handleCursoError = (res, error) => {
  if (error instanceof CursoError) {
    if (error.tipo === 'duplicado' || error.tipo === 'con_dependencias') {
      return conflict(res, error.message);
    }
    return badRequest(res, error.message);
  }

  // La FK de especialidad puede fallar igual si la borran entre la
  // validación y el insert.
  if (error.code === '23503') {
    return badRequest(res, 'La especialidad indicada no existe');
  }

  return serverError(res, error);
};

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

// Sólo el gestor crea cursos — la institución sale SIEMPRE del token
router.post('/', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['anio', 'division']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.createAsync(req.user.institucion_id, req.body);
    return created(res, data, 'Curso creado correctamente');
  } catch (error) {
    return handleCursoError(res, error);
  }
});

router.put('/:id', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['anio', 'division']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.updateAsync(req.params.id, req.user.institucion_id, req.body);

    if (!data) {
      return notFound(res, 'Curso no encontrado');
    }

    return ok(res, data, 'Curso actualizado correctamente');
  } catch (error) {
    return handleCursoError(res, error);
  }
});

router.delete('/:id', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const data = await service.deleteAsync(req.params.id, req.user.institucion_id);

    if (!data) {
      return notFound(res, 'Curso no encontrado');
    }

    return ok(res, data, 'Curso eliminado correctamente');
  } catch (error) {
    return handleCursoError(res, error);
  }
});

export default router;
