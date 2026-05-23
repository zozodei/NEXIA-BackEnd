import { Router } from 'express';
import alumnoService from './../services/alumnoService.js';

const router = Router (); 
const svc = new alumnoService();

router.get('', async (req, res) => {
    try {
        const data = await svc.getAllAsync();
        data != null ? res.status(200).json(data) : res.status(500).send('Error interno.');
    } catch (e) { 
        console.error("Error en GET /alumno:", e.message);
        res.status(500).send(`Error: ${e.message}`); 
    }
});

export default router;