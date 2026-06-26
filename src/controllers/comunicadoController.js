import { Router } from 'express';
import ComunicadoService from '../services/comunicadoService.js';
import {
  ok,
  created,
  badRequest,
  unauthorized,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';

const router = Router();
const service = new ComunicadoService();

// Solo el gestor puede crear comunicados
router.post('/', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'institucion_id',
      'gestor_id',
      'titulo',
      'contenido'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    if (!req.body.gestor_id) {
      return unauthorized(res, 'Solo el gestor puede crear comunicados');
    }

    const data = await service.createAsync(req.body);
    return created(res, data, 'Comunicado creado correctamente');
  } catch (error) {
    if (error.code === '23503') {
      return badRequest(res, 'La institución o el gestor no existe');
    }

    return serverError(res, error);
  }
});

// Todos pueden ver los comunicados de una institución
router.get('/:institucion_id', async (req, res) => {
  try {
    const data = await service.getAllByInstitucionAsync(req.params.institucion_id);
    return ok(res, data, 'Comunicados obtenidos correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
