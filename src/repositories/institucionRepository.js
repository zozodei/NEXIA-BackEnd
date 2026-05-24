import pool from '../database/db.js';

export default class InstitucionRepository {
	constructor() { console.log('Estoy en: InstitucionRepository.constructor()'); }

	getAllAsync = async () => {
		try { const result = await pool.query('SELECT * FROM institucion'); return result.rows; }
		catch (error) { console.log(error); return null; }
	}

	getByIdAsync = async (id) => {
		try { const result = await pool.query('SELECT * FROM institucion WHERE id = $1', [id]); return result.rows[0] || null; }
		catch (error) { console.log(error); return null; }
	}

	createAsync = async (payload) => {
		try {
			const keys = Object.keys(payload);
			if (keys.length === 0) return null;
			const cols = keys.join(', ');
			const params = keys.map((_, i) => `$${i + 1}`).join(', ');
			const values = keys.map(k => payload[k]);
			const q = `INSERT INTO institucion (${cols}) VALUES (${params}) RETURNING *`;
			const result = await pool.query(q, values);
			return result.rows[0] || null;
		} catch (error) { console.log(error); return null; }
	}

	updateAsync = async (id, payload) => {
		try {
			const keys = Object.keys(payload);
			if (keys.length === 0) return null;
			const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
			const values = keys.map(k => payload[k]);
			values.push(id);
			const q = `UPDATE institucion SET ${set} WHERE id = $${values.length} RETURNING *`;
			const result = await pool.query(q, values);
			return result.rows[0] || null;
		} catch (error) { console.log(error); return null; }
	}
}