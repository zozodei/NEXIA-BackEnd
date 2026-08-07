import { Router } from 'express';
import PerfilService, { ValidacionError } from '../services/perfilService.js';
import {
  ok,
  badRequest,
  forbidden,
  notFound,
  serverError,
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import uploadImage from '../middleware/uploadImageMiddleware.js';

const router = Router();
const service = new PerfilService();

// El gestor y el director no viven en la tabla `usuario` (tienen sus propias
// tablas, sin los campos de perfil), así que ninguno de los dos tiene
// `usuario_id` en el token. Este módulo es exclusivo de alumno/profesor/
// coordinador.
const soloConPerfil = (req, res, next) => {
  if (!req.user.usuario_id) {
    return forbidden(res, 'Tu tipo de cuenta no admite configurar un perfil desde esta pantalla');
  }
  next();
};

router.use(verifyToken, soloConPerfil);

/**
 * GET /api/perfil/me
 * Perfil completo del usuario autenticado (nunca incluye la password).
 */
router.get('/me', async (req, res) => {
  try {
    const perfil = await service.getPerfilAsync(req.user.usuario_id);
    if (!perfil) return notFound(res, 'No se encontró tu perfil');
    return ok(res, perfil);
  } catch (error) {
    return serverError(res, error);
  }
});

/**
 * PUT /api/perfil/me
 * Update parcial de datos personales y preferencias. Body admitido:
 * nombre, apellido, telefono, fecha_nacimiento, biografia, genero,
 * direccion, ciudad, pais, tema, idioma, notificaciones_email.
 * Cualquier otro campo (id, institucion_id, rol, dni, email, password,
 * activo, fecha_creacion, foto_perfil_url, avatar_config) se ignora: esos
 * tienen su propio endpoint o los gestiona la administración.
 */
router.put('/me', async (req, res) => {
  try {
    const perfil = await service.updateDatosAsync(req.user.usuario_id, req.body);
    return ok(res, perfil, 'Perfil actualizado correctamente');
  } catch (error) {
    if (error instanceof ValidacionError) return badRequest(res, error.message);
    return serverError(res, error);
  }
});

/**
 * PUT /api/perfil/me/avatar
 * Body: { skin, hair: { style, color }, eyes, accessories: { glasses, hat }, shirt_color }
 * Valida la estructura completa. Si es válida, guarda avatar_config y
 * limpia foto_perfil_url (además borra la foto anterior del storage si había).
 */
router.put('/me/avatar', async (req, res) => {
  try {
    const perfil = await service.setAvatarAsync(req.user.usuario_id, req.body);
    return ok(res, perfil, 'Avatar actualizado correctamente');
  } catch (error) {
    if (error instanceof ValidacionError) return badRequest(res, error.message);
    return serverError(res, error);
  }
});

/**
 * POST /api/perfil/me/foto (multipart/form-data, campo "imagen")
 * Sube la imagen a Supabase Storage, guarda foto_perfil_url y limpia
 * avatar_config. Si había una foto propia previa, se borra del storage.
 */
router.post(
  '/me/foto',
  (req, res, next) => {
    uploadImage.single('imagen')(req, res, (err) => {
      if (err) return badRequest(res, err.message);
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) return badRequest(res, 'No se recibió ninguna imagen');
      const perfil = await service.setFotoAsync(req.user.usuario_id, req.file);
      return ok(res, perfil, 'Foto de perfil actualizada correctamente');
    } catch (error) {
      return serverError(res, error);
    }
  }
);

/**
 * DELETE /api/perfil/me/imagen
 * Resetea foto_perfil_url y avatar_config a NULL (vuelve al avatar default).
 * Si había una foto propia, se borra del storage.
 */
router.delete('/me/imagen', async (req, res) => {
  try {
    const perfil = await service.limpiarImagenAsync(req.user.usuario_id);
    return ok(res, perfil, 'Imagen de perfil restablecida al valor por defecto');
  } catch (error) {
    return serverError(res, error);
  }
});

/**
 * PUT /api/perfil/me/password
 * Body: { password_actual, password_nueva }
 */
router.put('/me/password', async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['password_actual', 'password_nueva']);
    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    await service.cambiarPasswordAsync(
      req.user.usuario_id,
      req.body.password_actual,
      req.body.password_nueva
    );
    return ok(res, null, 'Contraseña actualizada correctamente');
  } catch (error) {
    if (error instanceof ValidacionError) return badRequest(res, error.message);
    return serverError(res, error);
  }
});

export default router;
