import { Router } from 'express';
import CalificacionService from '../services/calificacionService.js';
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

const router = Router();
const service = new CalificacionService();

// El profesor carga/actualiza la nota final de un alumno para su materia y bimestre
router.post('/', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'profe_curso_materia_id',
      'alumno_id',
      'bimestre_id',
      'nota'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    if (!notaValida(req.body.nota)) {
      return badRequest(res, 'La nota debe ser un número entre 0 y 10');
    }

    const pcm = await service.getDetallePcmAsync(req.body.profe_curso_materia_id);

    if (!pcm) {
      return badRequest(res, 'La materia asignada al profesor no existe');
    }

    if (String(pcm.profesor_id) !== String(req.user.profesor_id)) {
      return forbidden(res, 'Solo podés cargar notas en tus propias materias');
    }

    const cursoIdAlumno = await service.getAlumnoCursoIdAsync(req.body.alumno_id);

    if (String(cursoIdAlumno) !== String(pcm.curso_id)) {
      return badRequest(res, 'El alumno no pertenece al curso de esa materia');
    }

    const bimestre = await service.getBimestreByIdAsync(req.body.bimestre_id);

    if (!bimestre) {
      return badRequest(res, 'El bimestre no existe');
    }

    if (String(bimestre.institucion_id) !== String(pcm.institucion_id)) {
      return badRequest(res, 'El bimestre no pertenece a la institución del curso');
    }

    const data = await service.upsertAsync({
      alumno_id: req.body.alumno_id,
      curso_materia_id: pcm.curso_materia_id,
      bimestre_id: req.body.bimestre_id,
      profesor_id: req.user.profesor_id,
      nota: req.body.nota,
      observaciones: req.body.observaciones
    });

    return created(res, data, 'Nota registrada correctamente');
  } catch (error) {
    if (error.code === '23503') {
      return badRequest(res, 'El alumno o el bimestre no existen');
    }

    return serverError(res, error);
  }
});

// Notas finales de un alumno, por materia y bimestre (boletín)
router.get('/alumno/:alumnoId', verifyToken, async (req, res) => {
  try {
    const { rol, alumno_id } = req.user;

    if (rol === 'ALUMNO' && String(alumno_id) !== req.params.alumnoId) {
      return forbidden(res, 'Solo podés ver tus propias notas');
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

// Notas cargadas por el profesor en una materia (todos los alumnos del curso), opcionalmente filtradas por bimestre
router.get('/profe-curso-materia/:profeCursoMateriaId', verifyToken, async (req, res) => {
  try {
    if (!req.query.bimestre_id) {
      return badRequest(res, 'Falta el parámetro bimestre_id');
    }

    const { rol, profesor_id } = req.user;
    const pcm = await service.getDetallePcmAsync(req.params.profeCursoMateriaId);

    if (!pcm) return notFound(res, 'La materia asignada al profesor no existe');

    if (rol === 'PROFESOR' && String(pcm.profesor_id) !== String(profesor_id)) {
      return forbidden(res, 'Solo podés ver las notas de tus propias materias');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getByCursoMateriaAsync(pcm.curso_materia_id, req.query.bimestre_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
