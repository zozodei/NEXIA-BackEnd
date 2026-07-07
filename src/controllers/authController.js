import { Router } from 'express';
import AuthService from '../services/authService.js';
import {
  ok,
  badRequest,
  unauthorized,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';

const router = Router();
const service = new AuthService();

router.post('/login', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, [
      'institucion_id',
      'dni',
      'password'
    ]);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const user = await service.loginAsync(req.body);

    if (!user) {
      return unauthorized(res, 'Institución, DNI o contraseña incorrectos');
    }

    return ok(res, user, 'Login correcto');
  } catch (error) {
    return serverError(res, error);
  }
});

// Renueva el par de tokens a partir de un refresh token válido (rotación)
router.post('/refresh', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['refreshToken']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const tokens = service.refreshAsync(req.body.refreshToken);

    if (!tokens) {
      return unauthorized(res, 'Refresh token inválido o expirado');
    }

    return ok(res, tokens, 'Tokens renovados correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;