import { Router } from 'express';
import MazoService from '../services/mazoService.js';
import { ok, created, badRequest, notFound, serverError } from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

/* Flashcards con repetición espaciada. Mazos y tarjetas son privados del
   alumno: el alumno_id sale del token y toda consulta pasa por el mazo
   para verificar pertenencia. */

const router = Router();
const service = new MazoService();
const soloAlumno = [verifyToken, requireRoles('ALUMNO')];

/* ── Repaso y tarjetas ─────────────────────
   Estas rutas van ANTES que /:id. Express resuelve por orden de
   declaración, así que si /:id estuviera primero, "repaso" y "tarjetas"
   entrarían como si fueran identificadores de mazo. */

router.get('/repaso', soloAlumno, async (req, res) => {
  try {
    const data = await service.getPendientesAsync(req.user.alumno_id, req.query.mazo_id || null);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.post('/tarjetas/:id/repaso', soloAlumno, async (req, res) => {
  try {
    const calidad = Number(req.body?.calidad);

    if (!Number.isFinite(calidad) || calidad < 0 || calidad > 5) {
      return badRequest(res, 'La calificación del repaso debe ser un número entre 0 y 5');
    }

    const data = await service.registrarRepasoAsync(req.params.id, req.user.alumno_id, calidad);

    if (!data) {
      return notFound(res, 'Tarjeta no encontrada');
    }

    return ok(res, data, 'Repaso registrado');
  } catch (error) {
    return serverError(res, error);
  }
});

router.put('/tarjetas/:id', soloAlumno, async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['frente', 'reverso']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.actualizarTarjetaAsync(req.params.id, req.user.alumno_id, req.body);

    if (!data) {
      return notFound(res, 'Tarjeta no encontrada');
    }

    return ok(res, data, 'Tarjeta actualizada');
  } catch (error) {
    return serverError(res, error);
  }
});

router.delete('/tarjetas/:id', soloAlumno, async (req, res) => {
  try {
    const data = await service.eliminarTarjetaAsync(req.params.id, req.user.alumno_id);

    if (!data) {
      return notFound(res, 'Tarjeta no encontrada');
    }

    return ok(res, data, 'Tarjeta eliminada');
  } catch (error) {
    return serverError(res, error);
  }
});

// ── Mazos ──────────────────────────────────

router.get('/', soloAlumno, async (req, res) => {
  try {
    const data = await service.getMazosAsync(req.user.alumno_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.post('/', soloAlumno, async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['nombre']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.crearMazoAsync(req.user.alumno_id, req.body);
    return created(res, data, 'Mazo creado');
  } catch (error) {
    return serverError(res, error);
  }
});

router.get('/:id/tarjetas', soloAlumno, async (req, res) => {
  try {
    const mazo = await service.getMazoAsync(req.params.id, req.user.alumno_id);

    if (!mazo) {
      return notFound(res, 'Mazo no encontrado');
    }

    const tarjetas = await service.getTarjetasAsync(req.params.id, req.user.alumno_id);
    return ok(res, { mazo, tarjetas });
  } catch (error) {
    return serverError(res, error);
  }
});

router.post('/:id/tarjetas', soloAlumno, async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['frente', 'reverso']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.crearTarjetaAsync(req.params.id, req.user.alumno_id, req.body);

    // El INSERT ... WHERE EXISTS no inserta nada si el mazo no es del alumno
    if (!data) {
      return notFound(res, 'Mazo no encontrado');
    }

    return created(res, data, 'Tarjeta creada');
  } catch (error) {
    return serverError(res, error);
  }
});

router.put('/:id', soloAlumno, async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['nombre']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.actualizarMazoAsync(req.params.id, req.user.alumno_id, req.body);

    if (!data) {
      return notFound(res, 'Mazo no encontrado');
    }

    return ok(res, data, 'Mazo actualizado');
  } catch (error) {
    return serverError(res, error);
  }
});

router.delete('/:id', soloAlumno, async (req, res) => {
  try {
    const data = await service.eliminarMazoAsync(req.params.id, req.user.alumno_id);

    if (!data) {
      return notFound(res, 'Mazo no encontrado');
    }

    return ok(res, data, 'Mazo eliminado');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
