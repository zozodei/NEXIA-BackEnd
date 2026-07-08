import { Router } from 'express';
import EventoService from '../services/eventoService.js';
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

/* Calendario institucional: todos los usuarios autenticados lo VEN,
   pero solo el GESTOR puede crear y eliminar eventos. */

const router = Router();
const service = new EventoService();

const TIPOS_VALIDOS = ['evento', 'examen', 'entrega', 'feriado'];

// Eventos de la institución del usuario logueado
router.get('/', verifyToken, async (req, res) => {
  try {
    const data = await service.getByInstitucionAsync(req.user.institucion_id);
    return ok(res, data, 'Eventos obtenidos correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

// Crear evento — solo GESTOR; institución y gestor salen del token
router.post('/', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['titulo', 'fecha']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.fecha)) {
      return badRequest(res, 'La fecha debe tener formato YYYY-MM-DD');
    }

    if (req.body.tipo && !TIPOS_VALIDOS.includes(req.body.tipo)) {
      return badRequest(res, `Tipo inválido. Valores permitidos: ${TIPOS_VALIDOS.join(', ')}`);
    }

    const data = await service.createAsync({
      institucion_id: req.user.institucion_id,
      gestor_id: req.user.gestor_id,
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fecha: req.body.fecha,
      tipo: req.body.tipo
    });

    return created(res, data, 'Evento creado correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

// Eliminar evento — solo GESTOR, limitado a su institución
router.delete('/:id', verifyToken, requireRoles('GESTOR'), async (req, res) => {
  try {
    const data = await service.deleteAsync(req.params.id, req.user.institucion_id);

    if (!data) {
      return notFound(res, 'Evento no encontrado');
    }

    return ok(res, data, 'Evento eliminado correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
