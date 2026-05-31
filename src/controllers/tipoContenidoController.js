import { Router } from 'express';
import TipoContenidoService from '../services/tipoContenidoService.js';
import {
  ok,
  created,
  badRequest,
  conflict,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';

const router = Router();
const service = new TipoContenidoService();

router.get('/', async (req, res) => {
  try {
    const data = await service.getAllAsync();
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

router.post('/', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['nombre']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.createAsync(req.body);
    return created(res, data, 'Tipo de contenido creado correctamente');
  } catch (error) {
    if (error.code === '23505') {
      return conflict(res, 'Ese tipo de contenido ya existe');
    }

    return serverError(res, error);
  }
});

export default router;