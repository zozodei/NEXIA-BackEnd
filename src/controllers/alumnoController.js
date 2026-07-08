import { Router } from 'express';
import AlumnoService from '../services/alumnoService.js';
import { ok, notFound, forbidden, serverError } from '../helpers/responseHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

const router = Router();
const service = new AlumnoService();

// Solo GESTOR y DIRECTIVO pueden listar todos los alumnos
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

// GESTOR y DIRECTIVO pueden ver cualquier alumno; ALUMNO solo puede verse a sí mismo
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rol, alumno_id } = req.user;

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.id) {
      return forbidden(res, 'Solo podés ver tu propio perfil');
    }

    if (!['GESTOR', 'DIRECTIVO', 'ALUMNO'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getByIdAsync(req.params.id);

    if (!data) {
      return notFound(res, 'Alumno no encontrado');
    }

    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// GESTOR, DIRECTIVO, o el propio ALUMNO
router.get('/:id/materias', verifyToken, async (req, res) => {
  try {
    const { rol, alumno_id } = req.user;

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.id) {
      return forbidden(res, 'Solo podés ver tus propias materias');
    }

    if (!['GESTOR', 'DIRECTIVO', 'ALUMNO'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getMateriasConContenidosAsync(req.params.id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// GESTOR, DIRECTIVO, o el propio ALUMNO
router.get('/:id/contenidos', verifyToken, async (req, res) => {
  try {
    const { rol, alumno_id } = req.user;

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.id) {
      return forbidden(res, 'Solo podés ver tus propios contenidos');
    }

    if (!['GESTOR', 'DIRECTIVO', 'ALUMNO'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

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
