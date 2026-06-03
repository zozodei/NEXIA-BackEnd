import { Router } from 'express';
import ContenidoService from '../services/contenidoService.js';
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';

const router = Router();
const service = new ContenidoService();

router.get('/', async (req, res) => {
  try {
    const data = await service.getAllAsync();
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.get('/profesor/:profesorId', async (req, res) => {
  try {
    const data = await service.getByProfesorAsync(req.params.profesorId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.get('/profe-curso-materia/:profeCursoMateriaId', async (req, res) => {
  try {
    const data = await service.getByProfeCursoMateriaAsync(
      req.params.profeCursoMateriaId
    );

    if (!data) {
      return notFound(res, 'La materia asignada al profesor no existe');
    }

    return ok(res, data, 'Contenidos de la materia obtenidos correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

router.post('/', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'profe_curso_materia_id',
      'tipo_contenido_id',
      'titulo',
      'archivo_url'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.createAsync(req.body);
    return created(res, data, 'Contenido creado correctamente');
  } catch (error) {
    if (error.code === '23503') {
      return badRequest(res, 'El tipo de contenido o la materia del profesor no existe');
    }

    return serverError(res, error);
  }
});

export default router;