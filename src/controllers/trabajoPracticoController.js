import { Router } from 'express';
import TrabajoPracticoService from '../services/trabajoPracticoService.js';
import {
  ok,
  created,
  badRequest,
  notFound,
  forbidden,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields, notaValida } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';
import uploadEntregable from '../middleware/uploadEntregableMiddleware.js';
import NotificacionService from '../services/notificacionService.js';

const router = Router();
const service = new TrabajoPracticoService();
const notificaciones = new NotificacionService();

// Sube el archivo (consigna del profesor o entrega del alumno) y devuelve la URL
router.post(
  '/upload',
  verifyToken,
  requireRoles('PROFESOR', 'ALUMNO'),
  (req, res, next) => {
    uploadEntregable.single('archivo')(req, res, (err) => {
      if (err) return badRequest(res, err.message);
      next();
    });
  },
  (req, res) => {
    if (!req.file) return badRequest(res, 'No se recibió ningún archivo');
    const url = `http://localhost:3000/uploads/${req.file.filename}`;
    return ok(res, { url }, 'Archivo subido correctamente');
  }
);

// Crear un TP (queda como borrador, activo = false) — solo el PROFESOR dueño de la materia
router.post('/', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'profe_curso_materia_id',
      'titulo'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const pcm = await service.getDetallePcmAsync(req.body.profe_curso_materia_id);

    if (!pcm) {
      return badRequest(res, 'La materia asignada al profesor no existe');
    }

    if (String(pcm.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés crear trabajos prácticos en tus propias materias');
    }

    const data = await service.createAsync(req.body);
    return created(res, data, 'Trabajo práctico creado correctamente');
  } catch (error) {
    if (error.code === '23503') {
      return badRequest(res, 'La materia asignada al profesor no existe');
    }

    return serverError(res, error);
  }
});

// Editar un TP (título, descripción, consigna, fecha límite) — solo el PROFESOR dueño
router.put('/:id', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    const tp = await service.getByIdAsync(req.params.id);

    if (!tp) return notFound(res, 'El trabajo práctico no existe');

    if (String(tp.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés editar tus propios trabajos prácticos');
    }

    const data = await service.updateAsync(req.params.id, req.body);
    return ok(res, data, 'Trabajo práctico actualizado correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

// Publicar / volver a borrador — solo el PROFESOR dueño
router.patch('/:id/estado', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    if (typeof req.body.activo !== 'boolean') {
      return badRequest(res, 'Falta el campo activo (boolean)');
    }

    const tp = await service.getByIdAsync(req.params.id);

    if (!tp) return notFound(res, 'El trabajo práctico no existe');

    if (String(tp.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés publicar tus propios trabajos prácticos');
    }

    const data = await service.setEstadoAsync(req.params.id, req.body.activo);

    // Primera publicación (fecha_publicacion estaba en null): avisar a los
    // alumnos del curso. Fire-and-forget: no bloquea ni rompe la respuesta.
    if (req.body.activo === true && !tp.fecha_publicacion) {
      notificaciones.notificarNuevoTp({ tp });
    }

    return ok(
      res,
      data,
      req.body.activo ? 'Trabajo práctico publicado correctamente' : 'Trabajo práctico pasado a borrador'
    );
  } catch (error) {
    return serverError(res, error);
  }
});

// Listar TPs de una materia — PROFESOR dueño ve todo (borradores incluidos), GESTOR/DIRECTIVO también
router.get('/profe-curso-materia/:profeCursoMateriaId', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;
    const pcm = await service.getDetallePcmAsync(req.params.profeCursoMateriaId);

    if (!pcm) return notFound(res, 'La materia asignada al profesor no existe');

    if (rol === 'PROFESOR' && String(pcm.profesor_id) !== String(profesor_id)) {
      return forbidden(res, 'Solo podés ver los trabajos prácticos de tus propias materias');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getByProfeCursoMateriaAsync(req.params.profeCursoMateriaId);
    return ok(res, { materia: pcm, trabajos_practicos: data });
  } catch (error) {
    return serverError(res, error);
  }
});

// Listar TPs publicados de un alumno, con el estado de su entrega y su nota
router.get('/alumno/:alumnoId', verifyToken, async (req, res) => {
  try {
    const { rol, alumno_id } = req.user;

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.alumnoId) {
      return forbidden(res, 'Solo podés ver tus propios trabajos prácticos');
    }

    if (!['GESTOR', 'DIRECTIVO', 'ALUMNO'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getByAlumnoAsync(req.params.alumnoId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// Detalle de un TP puntual
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id, curso_id } = req.user;
    const tp = await service.getByIdAsync(req.params.id);

    if (!tp) return notFound(res, 'El trabajo práctico no existe');

    if (rol === 'PROFESOR' && String(tp.profesor_id) !== String(profesor_id)) {
      return forbidden(res, 'No tenés permiso para ver este trabajo práctico');
    }

    if (rol === 'ALUMNO' && (!tp.activo || String(tp.curso_id) !== String(curso_id))) {
      return forbidden(res, 'No tenés permiso para ver este trabajo práctico');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR', 'ALUMNO'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    return ok(res, tp);
  } catch (error) {
    return serverError(res, error);
  }
});

// El alumno sube su entrega (el archivo ya se subió antes por /upload). Reemplaza la anterior si aún no fue corregida.
router.post('/:id/entregas', verifyToken, requireRoles('ALUMNO'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['archivo_url']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const tp = await service.getByIdAsync(req.params.id);

    if (!tp) return notFound(res, 'El trabajo práctico no existe');

    if (String(tp.curso_id) !== String(req.user.curso_id)) {
      return forbidden(res, 'Este trabajo práctico no corresponde a tu curso');
    }

    const resultado = await service.crearEntregaAsync({
      trabajo_practico_id: req.params.id,
      alumno_id: req.user.alumno_id,
      archivo_url: req.body.archivo_url,
      comentario_alumno: req.body.comentario_alumno
    });

    if (resultado.error === 'NO_PUBLICADO') {
      return badRequest(res, 'Este trabajo práctico todavía no fue publicado');
    }

    if (resultado.error === 'FUERA_DE_TERMINO') {
      return badRequest(res, 'La fecha límite de entrega ya pasó');
    }

    if (resultado.error === 'YA_CORREGIDO') {
      return badRequest(res, 'Esta entrega ya fue corregida, no podés reemplazarla');
    }

    return created(res, resultado.entrega, 'Entrega subida correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

// Ver la entrega de un alumno puntual para un TP
router.get('/:id/entregas/:alumnoId', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id, alumno_id } = req.user;

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.alumnoId) {
      return forbidden(res, 'Solo podés ver tu propia entrega');
    }

    const tp = await service.getByIdAsync(req.params.id);

    if (!tp) return notFound(res, 'El trabajo práctico no existe');

    if (rol === 'PROFESOR' && String(tp.profesor_id) !== String(profesor_id)) {
      return forbidden(res, 'Solo podés ver entregas de tus propias materias');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR', 'ALUMNO'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getEntregaAlumnoAsync(req.params.id, req.params.alumnoId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// Vista del profesor: todos los alumnos del curso con su entrega (si existe)
router.get('/:id/entregas', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;
    const tp = await service.getByIdAsync(req.params.id);

    if (!tp) return notFound(res, 'El trabajo práctico no existe');

    if (rol === 'PROFESOR' && String(tp.profesor_id) !== String(profesor_id)) {
      return forbidden(res, 'Solo podés ver entregas de tus propias materias');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getEntregasConNotasAsync(req.params.id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// El profesor corrige y pone nota a la entrega de un alumno
router.put('/:id/notas/:alumnoId', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['nota']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    if (!notaValida(req.body.nota)) {
      return badRequest(res, 'La nota debe ser un número entre 0 y 10');
    }

    const tp = await service.getByIdAsync(req.params.id);

    if (!tp) return notFound(res, 'El trabajo práctico no existe');

    if (String(tp.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés calificar tus propios trabajos prácticos');
    }

    const resultado = await service.calificarAsync({
      trabajo_practico_id: req.params.id,
      alumno_id: req.params.alumnoId,
      nota: req.body.nota,
      comentario_correccion: req.body.comentario_correccion
    });

    if (!resultado) {
      return badRequest(res, 'El alumno todavía no entregó este trabajo práctico');
    }

    // Avisar al alumno que su entrega fue corregida (fire-and-forget)
    notificaciones.notificarCorreccionTp({
      alumnoId: req.params.alumnoId,
      tp,
      entrega: resultado,
    });

    return ok(res, resultado, 'Nota registrada correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
