import pool from '../database/db.js';
import materiaRepository from "../repositories/materiaRepository.js"

export default class materiaService{
	constructor(){
	   console.log('Estoy en: materiaService.constructor()');
		this.repo = new materiaRepository();
	}

	getAllAsync = async() => await this.repo.getAllAsync();

	getByIdAsync = async (id) => await this.repo.getByIdAsync(id);

	createAsync = async (payload) => await this.repo.createAsync(payload);

	updateAsync = async (id, payload) => await this.repo.updateAsync(id, payload);
}
