import { Router } from 'express';
import UsuarioService, { ValidacionError } from '../services/usuarioService.js';
import {
  ok,
  badRequest,
  notFound,
  serverError,
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import uploadImage from '../middleware/uploadImageMiddleware.js';

const router = Router();
const service = new UsuarioService();

// Los gestores y directivos no viven en la tabla usuario (no tienen usuario_id
// en el token), así que la configuración de perfil no aplica para ellos.
const CUENTA_SIN_PERFIL =
  'Tu tipo de cuenta no admite editar el perfil desde esta pantalla';

// Perfil + preferencias del usuario autenticado
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user.usuario_id) return notFound(res, CUENTA_SIN_PERFIL);

    const perfil = await service.getPerfilAsync(req.user.usuario_id);
    if (!perfil) return notFound(res, 'No se encontró tu perfil');

    return ok(res, perfil);
  } catch (error) {
    return serverError(res, error);
  }
});

// Actualiza perfil y/o preferencias (update parcial)
router.put('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user.usuario_id) return badRequest(res, CUENTA_SIN_PERFIL);

    const perfil = await service.updatePerfilAsync(req.user.usuario_id, req.body);
    return ok(res, perfil, 'Configuración actualizada correctamente');
  } catch (error) {
    if (error instanceof ValidacionError) return badRequest(res, error.message);
    // Email duplicado dentro de la institución (unique violation)
    if (error.code === '23505') return badRequest(res, 'Ese email ya está en uso');
    return serverError(res, error);
  }
});

// Sube una nueva foto de perfil y devuelve su URL pública.
// El frontend luego la persiste llamando a PUT /me con foto_perfil_url.
router.post(
  '/me/foto',
  verifyToken,
  (req, res, next) => {
    uploadImage.single('imagen')(req, res, (err) => {
      if (err) return badRequest(res, err.message);
      next();
    });
  },
  (req, res) => {
    if (!req.file) return badRequest(res, 'No se recibió ninguna imagen');
    const url = `http://localhost:3000/uploads/${req.file.filename}`;
    return ok(res, { url }, 'Imagen subida correctamente');
  }
);

// Cambio de contraseña
router.put('/me/password', verifyToken, async (req, res) => {
  try {
    if (!req.user.usuario_id) return badRequest(res, CUENTA_SIN_PERFIL);

    const faltantes = missingFields(req.body, ['passwordActual', 'passwordNueva']);
    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    await service.cambiarPasswordAsync(
      req.user.usuario_id,
      req.body.passwordActual,
      req.body.passwordNueva
    );
    return ok(res, null, 'Contraseña actualizada correctamente');
  } catch (error) {
    if (error instanceof ValidacionError) return badRequest(res, error.message);
    return serverError(res, error);
  }
});

export default router;
