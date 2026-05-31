import { Router } from 'express';
import AuthService from '../services/authService.js';
import { ok, badRequest, unauthorized, serverError } from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';

const router = Router();
const service = new AuthService();

router.post('/login', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'institucion_id',
      'dni',
      'password',
      'rol'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const user = await service.loginAsync(req.body);

    if (!user) {
      return unauthorized(res, 'Institución, DNI, contraseña o rol incorrectos');
    }

    return ok(res, user, 'Login correcto');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;