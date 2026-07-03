import { Router } from 'express';
import BimestreService from '../services/bimestreService.js';
import {
  ok,
  created,
  badRequest,
  conflict,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';

const router = Router();
const service = new BimestreService();

// Solo GESTOR y DIRECTIVO definen los bimestres de su institución
router.post('/', verifyToken, requireRoles('GESTOR', 'DIRECTIVO'), async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['nombre', 'anio', 'orden']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const data = await service.createAsync({
      ...req.body,
      institucion_id: req.user.institucion_id
    });

    return created(res, data, 'Bimestre creado correctamente');
  } catch (error) {
    if (error.code === '23505') {
      return conflict(res, 'Ya existe ese bimestre (mismo año y orden) para tu institución');
    }

    return serverError(res, error);
  }
});

// Cualquier usuario autenticado ve los bimestres de su propia institución
router.get('/', verifyToken, async (req, res) => {
  try {
    const data = await service.getByInstitucionAsync(req.user.institucion_id);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
