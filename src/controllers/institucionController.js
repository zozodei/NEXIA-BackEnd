import { Router } from 'express';
import InstitucionService from './../services/institucionService.js';

const router = Router();
const svc = new InstitucionService();

router.get('/', async (req, res) => {
    try {
        const data = await svc.getAllAsync();

        return res.status(200).json(data);
    } catch (e) {
        console.error("Error en GET /institucion:", e.message);

        return res.status(500).json({
            message: "Error interno en institución.",
            error: e.message,
            detail: e.detail || null,
            code: e.code || null
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const data = await svc.getByIdAsync(id);

        if (!data) {
            return res.status(404).send('Institución no encontrada.');
        }

        return res.status(200).json(data);
    } catch (e) {
        console.error("Error en GET /institucion/:id:", e.message);

        return res.status(500).json({
            message: "Error interno en institución.",
            error: e.message,
            detail: e.detail || null,
            code: e.code || null
        });
    }
});

export default router;