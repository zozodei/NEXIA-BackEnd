import { Router } from 'express';
import materiaService from './../services/materiaService.js';

const router = Router();
const svc = new materiaService();

router.get('', async (req, res) => {
	try {
		const data = await svc.getAllAsync();
		data != null ? res.status(200).json(data) : res.status(500).send('Error interno.');
	} catch (e) {
		console.error("Error en GET /materia:", e.message);
		res.status(500).send(`Error: ${e.message}`);
	}
});

router.get('/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const data = await svc.getByIdAsync(id);
		data ? res.status(200).json(data) : res.status(404).send('No encontrado.');
	} catch (e) {
		console.error("Error en GET /materia/:id:", e.message);
		res.status(500).send(`Error: ${e.message}`);
	}
});

router.post('', async (req, res) => {
	try {
		const payload = req.body;
		const created = await svc.createAsync(payload);
		created ? res.status(201).json(created) : res.status(500).send('Error al crear.');
	} catch (e) {
		console.error("Error en POST /materia:", e.message);
		res.status(500).send(`Error: ${e.message}`);
	}
});

router.put('/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const payload = req.body;
		const updated = await svc.updateAsync(id, payload);
		updated ? res.status(200).json(updated) : res.status(404).send('No encontrado o no se actualizó.');
	} catch (e) {
		console.error("Error en PUT /materia/:id:", e.message);
		res.status(500).send(`Error: ${e.message}`);
	}
});

export default router;
