import { Router } from 'express';
import GestorService from '../services/gestorService.js';
import {
  created,
  ok,
  badRequest,
  notFound,
  conflict,
  forbidden,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

const router = Router();
const service = new GestorService();

const handlePostgresError = (res, error) => {
  if (error.code === '23505') {
    return conflict(res, 'Ya existe un registro con email o DNI repetido');
  }

  if (error.code === '23503') {
    return badRequest(res, 'Algún ID enviado no existe en la base de datos');
  }

  return serverError(res, error);
};

// Ruta de bootstrap — SOLO sirve para crear el PRIMER gestor de una
// institución. Si la institución ya tiene gestor, se rechaza: evita que
// cualquiera se cree una cuenta de administrador.
router.post('/', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['nombre', 'dni', 'password', 'institucion_id']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const yaTieneGestor = await service.institucionTieneGestorAsync(req.body.institucion_id);

    if (yaTieneGestor) {
      return forbidden(res, 'La institución ya tiene un gestor asignado');
    }

    const data = await service.crearGestorAsync(req.body);
    return created(res, data, 'Gestor creado correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

// Las siguientes rutas requieren rol GESTOR
router.post('/alumnos', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'nombre',
      'apellido',
      'email',
      'password',
      'dni',
      'curso_id'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    // La institución sale SIEMPRE del token: un gestor no puede crear
    // alumnos en otra institución
    const institucion_id = req.user.institucion_id;

    const cursoValido = await service.cursoPerteneceAInstitucionAsync(req.body.curso_id, institucion_id);

    if (!cursoValido) {
      return badRequest(res, 'El curso no pertenece a tu institución');
    }

    const data = await service.crearAlumnoAsync({ ...req.body, institucion_id });
    return created(res, data, 'Alumno creado correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

router.post('/profesores', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'nombre',
      'apellido',
      'email',
      'password',
      'dni'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    // La institución sale SIEMPRE del token
    const data = await service.crearProfesorAsync({
      ...req.body,
      institucion_id: req.user.institucion_id
    });
    return created(res, data, 'Profesor creado correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

router.put('/alumnos/:alumnoId/curso', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['curso_id']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const institucion_id = req.user.institucion_id;

    const [alumnoValido, cursoValido] = await Promise.all([
      service.alumnoPerteneceAInstitucionAsync(req.params.alumnoId, institucion_id),
      service.cursoPerteneceAInstitucionAsync(req.body.curso_id, institucion_id)
    ]);

    if (!alumnoValido) {
      return forbidden(res, 'El alumno no pertenece a tu institución');
    }

    if (!cursoValido) {
      return badRequest(res, 'El curso no pertenece a tu institución');
    }

    const data = await service.asignarAlumnoACursoAsync(
      req.params.alumnoId,
      req.body.curso_id
    );

    if (!data) {
      return notFound(res, 'Alumno no encontrado');
    }

    return ok(res, data, 'Alumno asignado a curso correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

router.post('/profesores/asignar-materia', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'profesor_id',
      'curso_id',
      'materia_id'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const institucion_id = req.user.institucion_id;

    const [profesorValido, cursoValido] = await Promise.all([
      service.profesorPerteneceAInstitucionAsync(req.body.profesor_id, institucion_id),
      service.cursoPerteneceAInstitucionAsync(req.body.curso_id, institucion_id)
    ]);

    if (!profesorValido) {
      return forbidden(res, 'El profesor no pertenece a tu institución');
    }

    if (!cursoValido) {
      return badRequest(res, 'El curso no pertenece a tu institución');
    }

    const data = await service.asignarProfesorAMateriaAsync(req.body);
    return created(res, data, 'Profesor asignado a materia correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

export default router;
