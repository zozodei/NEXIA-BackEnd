import { Router } from 'express';
import ClaseService from '../services/claseService.js';
import {
  ok,
  created,
  badRequest,
  notFound,
  forbidden,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields, estadoAsistenciaValido } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

const router = Router();
const service = new ClaseService();

// El profesor "abre" la lista del día: crea la clase si no existe, o devuelve la ya creada para esa fecha
router.post('/', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['profe_curso_materia_id']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const pcm = await service.getDetallePcmAsync(req.body.profe_curso_materia_id);

    if (!pcm) {
      return badRequest(res, 'La materia asignada al profesor no existe');
    }

    if (String(pcm.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés tomar lista en tus propias materias');
    }

    const data = await service.getOrCreateAsync({
      profe_curso_materia_id: req.body.profe_curso_materia_id,
      fecha: req.body.fecha,
      tema: req.body.tema,
      observaciones: req.body.observaciones
    });

    return created(res, data, 'Clase disponible para tomar lista');
  } catch (error) {
    if (error.code === '23503') {
      return badRequest(res, 'La materia asignada al profesor no existe');
    }

    return serverError(res, error);
  }
});

// Historial de clases de una materia, con el resumen de asistencia de cada una
router.get('/profe-curso-materia/:profeCursoMateriaId', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;
    const pcm = await service.getDetallePcmAsync(req.params.profeCursoMateriaId);

    if (!pcm) return notFound(res, 'La materia asignada al profesor no existe');

    if (rol === 'PROFESOR' && String(pcm.profesor_id) !== String(profesor_id)) {
      return forbidden(res, 'Solo podés ver las clases de tus propias materias');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getByProfeCursoMateriaAsync(req.params.profeCursoMateriaId);
    return ok(res, { materia: pcm, clases: data });
  } catch (error) {
    return serverError(res, error);
  }
});

// Detalle de una clase puntual
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;
    const clase = await service.getByIdAsync(req.params.id);

    if (!clase) return notFound(res, 'La clase no existe');

    if (rol === 'PROFESOR' && String(clase.profesor_id) !== String(profesor_id)) {
      return forbidden(res, 'Solo podés ver tus propias clases');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    return ok(res, clase);
  } catch (error) {
    return serverError(res, error);
  }
});

// Editar el tema/observaciones de una clase — solo el PROFESOR dueño, y solo si la lista sigue abierta
router.put('/:id', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    const clase = await service.getByIdAsync(req.params.id);

    if (!clase) return notFound(res, 'La clase no existe');

    if (String(clase.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés editar tus propias clases');
    }

    if (clase.lista_cerrada) {
      return badRequest(res, 'La lista de esta clase ya está cerrada');
    }

    const data = await service.updateAsync(req.params.id, req.body);
    return ok(res, data, 'Clase actualizada correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

// Cerrar la lista de una clase — solo el PROFESOR dueño
router.patch('/:id/cerrar', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    const clase = await service.getByIdAsync(req.params.id);

    if (!clase) return notFound(res, 'La clase no existe');

    if (String(clase.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés cerrar tus propias clases');
    }

    const data = await service.cerrarAsync(req.params.id);
    return ok(res, data, 'Lista cerrada correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

// Grilla para tomar/ver la lista: alumnos del curso con su estado actual en esta clase
router.get('/:id/asistencias', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;
    const clase = await service.getByIdAsync(req.params.id);

    if (!clase) return notFound(res, 'La clase no existe');

    if (rol === 'PROFESOR' && String(clase.profesor_id) !== String(profesor_id)) {
      return forbidden(res, 'Solo podés ver la lista de tus propias clases');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getGrillaAsync(req.params.id);
    return ok(res, { clase, alumnos: data });
  } catch (error) {
    return serverError(res, error);
  }
});

// Guardar/editar la lista — solo el PROFESOR dueño, y solo si no está cerrada
router.post('/:id/asistencias', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    if (!Array.isArray(req.body.alumnos) || req.body.alumnos.length === 0) {
      return badRequest(res, 'Falta la lista de alumnos');
    }

    const estadoInvalido = req.body.alumnos.some((a) => !estadoAsistenciaValido(a.estado));

    if (estadoInvalido) {
      return badRequest(res, 'Todos los alumnos deben tener un estado válido (presente, ausente, tardanza, justificado)');
    }

    const clase = await service.getByIdAsync(req.params.id);

    if (!clase) return notFound(res, 'La clase no existe');

    if (String(clase.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés tomar lista en tus propias clases');
    }

    if (clase.lista_cerrada) {
      return badRequest(res, 'La lista de esta clase ya está cerrada');
    }

    const data = await service.guardarListaAsync(req.params.id, req.body.alumnos, req.user.profesor_id);
    return ok(res, data, 'Lista guardada correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
