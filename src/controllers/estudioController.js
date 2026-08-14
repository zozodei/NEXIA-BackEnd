import { Router } from 'express';
import EstudioService from '../services/estudioService.js';
import { ok, created, badRequest, notFound, serverError } from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

/* Zona de estudio — sesiones Pomodoro y objetivos.
   Datos personales del alumno: el alumno_id sale siempre del token. */

const router = Router();
const service = new EstudioService();
const soloAlumno = [verifyToken, requireRoles('ALUMNO')];

// Todo lo que el hub necesita, en una sola llamada
router.get('/resumen', soloAlumno, async (req, res) => {
  try {
    const data = await service.getResumenAsync(req.user.alumno_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.post('/sesiones', soloAlumno, async (req, res) => {
  try {
    const data = await service.registrarSesionAsync(req.user.alumno_id, req.body);
    return created(res, data, 'Sesión registrada');
  } catch (error) {
    return serverError(res, error);
  }
});

// ── Objetivos ──────────────────────────────

router.get('/objetivos', soloAlumno, async (req, res) => {
  try {
    const data = await service.getObjetivosAsync(req.user.alumno_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.post('/objetivos', soloAlumno, async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['texto']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.crearObjetivoAsync(req.user.alumno_id, req.body);
    return created(res, data, 'Objetivo creado');
  } catch (error) {
    return serverError(res, error);
  }
});

// PATCH y no PUT: el frontend manda sólo el campo que cambió (tildar un
// objetivo no debería obligarlo a reenviar texto y estimación).
router.patch('/objetivos/:id', soloAlumno, async (req, res) => {
  try {
    const data = await service.actualizarObjetivoAsync(req.params.id, req.user.alumno_id, req.body);

    if (!data) {
      return notFound(res, 'Objetivo no encontrado');
    }

    return ok(res, data, 'Objetivo actualizado');
  } catch (error) {
    return serverError(res, error);
  }
});

// Suma un pomodoro al objetivo en el que se estuvo trabajando
router.post('/objetivos/:id/pomodoro', soloAlumno, async (req, res) => {
  try {
    const data = await service.sumarPomodoroAsync(req.params.id, req.user.alumno_id);

    if (!data) {
      return notFound(res, 'Objetivo no encontrado');
    }

    return ok(res, data, 'Pomodoro registrado');
  } catch (error) {
    return serverError(res, error);
  }
});

router.delete('/objetivos/completados', soloAlumno, async (req, res) => {
  try {
    const eliminados = await service.eliminarCompletadosAsync(req.user.alumno_id);
    return ok(res, { eliminados }, 'Objetivos completados eliminados');
  } catch (error) {
    return serverError(res, error);
  }
});

router.delete('/objetivos/:id', soloAlumno, async (req, res) => {
  try {
    const data = await service.eliminarObjetivoAsync(req.params.id, req.user.alumno_id);

    if (!data) {
      return notFound(res, 'Objetivo no encontrado');
    }

    return ok(res, data, 'Objetivo eliminado');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
