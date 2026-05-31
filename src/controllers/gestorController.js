import { Router } from 'express';
import GestorService from '../services/gestorService.js';
import {
  created,
  ok,
  badRequest,
  notFound,
  conflict,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';

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

router.post('/', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['nombre', 'dni', 'password']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.crearGestorAsync(req.body);
    return created(res, data, 'Gestor creado correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

router.post('/alumnos', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'institucion_id',
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

    const data = await service.crearAlumnoAsync(req.body);
    return created(res, data, 'Alumno creado correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

router.post('/profesores', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'institucion_id',
      'nombre',
      'apellido',
      'email',
      'password',
      'dni'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.crearProfesorAsync(req.body);
    return created(res, data, 'Profesor creado correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

router.put('/alumnos/:alumnoId/curso', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['curso_id']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
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

router.post('/profesores/asignar-materia', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'profesor_id',
      'curso_id',
      'materia_id'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.asignarProfesorAMateriaAsync(req.body);
    return created(res, data, 'Profesor asignado a materia correctamente');
  } catch (error) {
    return handlePostgresError(res, error);
  }
});

export default router;