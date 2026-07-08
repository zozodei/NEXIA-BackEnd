import { Router } from 'express';
import ProfesorService from '../services/profesorService.js';
import { ok, notFound, forbidden, serverError } from '../helpers/responseHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

const router = Router();
const service = new ProfesorService();

// Solo GESTOR y DIRECTIVO pueden listar todos los profesores
router.get('/', verifyToken, requireRoles('GESTOR', 'DIRECTIVO'), async (req, res) => {
  try {
    // Limitado a la institución del token
    const institucionId = req.user.institucion_id ?? req.query.institucion_id;
    const data = await service.getAllAsync(institucionId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// GESTOR y DIRECTIVO pueden ver cualquier profesor; PROFESOR solo puede verse a sí mismo
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;

    if (rol === 'PROFESOR' && String(profesor_id) !== req.params.id) {
      return forbidden(res, 'Solo podés ver tu propio perfil');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getByIdAsync(req.params.id);

    if (!data) {
      return notFound(res, 'Profesor no encontrado');
    }

    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// Alumnos en riesgo en las materias del profesor — GESTOR, DIRECTIVO o el propio PROFESOR
router.get('/:id/alumnos-en-riesgo', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;

    if (rol === 'PROFESOR' && String(profesor_id) !== req.params.id) {
      return forbidden(res, 'Solo podés ver los alumnos de tus propias materias');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getAlumnosEnRiesgoAsync(req.params.id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// GESTOR, DIRECTIVO, o el propio PROFESOR
router.get('/:id/materias', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;

    if (rol === 'PROFESOR' && String(profesor_id) !== req.params.id) {
      return forbidden(res, 'Solo podés ver tus propias materias');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getMateriasAsync(req.params.id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
