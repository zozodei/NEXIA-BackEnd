import { Router } from 'express';
import IaService from '../services/iaService.js';
import { ok, badRequest, serverError } from '../helpers/responseHelper.js';
import { missingFields } from '../helpers/validationHelper.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();
const service = new IaService();

// Cualquier usuario autenticado puede consultar al tutor de IA
router.post('/consulta', verifyToken, async (req, res) => {
  try {
    const faltantes = missingFields(req.body, ['pregunta']);

    if (faltantes.length > 0) {
      return badRequest(res, `Faltan campos: ${faltantes.join(', ')}`);
    }

    const historial = Array.isArray(req.body.historial) ? req.body.historial : [];

    const respuesta = await service.consultarAsync({
      pregunta: req.body.pregunta,
      historial,
      nombre: req.user.nombre
    });

    return ok(res, { respuesta }, 'Respuesta generada correctamente');
  } catch (error) {
    if (String(error.message).includes('RESOURCE_EXHAUSTED') || String(error.message).includes('"code":429')) {
      return res.status(429).json({
        ok: false,
        message: 'Se alcanzó el límite de consultas gratuitas de la IA por ahora. Esperá unos minutos e intentá de nuevo.'
      });
    }

    return serverError(res, error);
  }
});

export default router;
