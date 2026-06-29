import { Router } from 'express';
import ContenidoService from '../services/contenidoService.js';
import {
  ok,
  created,
  badRequest,
  notFound,
  forbidden,
  serverError
} from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rolesMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = Router();
const service = new ContenidoService();

// Vista admin — solo GESTOR y DIRECTIVO
router.get('/', verifyToken, requireRoles('GESTOR', 'DIRECTIVO'), async (req, res) => {
  try {
    const data = await service.getAllAsync();
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// GESTOR, DIRECTIVO, o el propio PROFESOR
router.get('/profesor/:profesorId', verifyToken, async (req, res) => {
  try {
    const { rol, profesor_id } = req.user;

    if (rol === 'PROFESOR' && String(profesor_id) !== req.params.profesorId) {
      return forbidden(res, 'Solo podés ver tus propios contenidos');
    }

    if (!['GESTOR', 'DIRECTIVO', 'PROFESOR'].includes(rol)) {
      return forbidden(res, 'No tenés permiso para realizar esta acción');
    }

    const data = await service.getByProfesorAsync(req.params.profesorId);
    return ok(res, data);
  } catch (error) {
    return serverError(res, error);
  }
});

// Cualquier usuario autenticado puede ver contenidos de una materia
router.get('/profe-curso-materia/:profeCursoMateriaId', verifyToken, async (req, res) => {
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

// Upload de PDF — solo PROFESOR
router.post(
  '/upload',
  verifyToken,
  requireRoles('PROFESOR'),
  (req, res, next) => {
    upload.single('archivo')(req, res, (err) => {
      if (err) return badRequest(res, err.message);
      next();
    });
  },
  (req, res) => {
    if (!req.file) return badRequest(res, 'No se recibió ningún archivo');
    const url = `http://localhost:3000/uploads/${req.file.filename}`;
    return ok(res, { url }, 'Archivo subido correctamente');
  }
);

// Solo el PROFESOR puede subir contenido
router.post('/', verifyToken, requireRoles('PROFESOR'), async (req, res) => {
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

// Cualquier usuario autenticado puede ver un contenido por ID
router.get('/contenido/:contenidoId', verifyToken, async (req, res) => {
  try {
    const data = await service.getByIdAsync(req.params.contenidoId);

    if (!data) {
      return notFound(res, 'El contenido no existe');
    }

    return ok(res, data, 'Contenido obtenido correctamente');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
