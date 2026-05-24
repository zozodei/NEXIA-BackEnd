import cursoRepository from "../repositories/cursoRepository.js"

export default class cursoService{
	constructor(){
	   console.log('Estoy en: cursoService.constructor()');
		this.repo = new cursoRepository();
	}

	getAllAsync = async() => await this.repo.getAllAsync();

	getByIdAsync = async (id) => await this.repo.getByIdAsync(id);

	createAsync = async (payload) => await this.repo.createAsync(payload);

	updateAsync = async (id, payload) => await this.repo.updateAsync(id, payload);
}
