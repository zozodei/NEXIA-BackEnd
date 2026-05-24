import institucionRepository from "../repositories/institucionRepository.js"

export default class institucionService{
	constructor(){
	   console.log('Estoy en: institucionService.constructor()');
		this.repo = new institucionRepository();
	}

	getAllAsync = async() => await this.repo.getAllAsync();

	getByIdAsync = async (id) => await this.repo.getByIdAsync(id);

	createAsync = async (payload) => await this.repo.createAsync(payload);

	updateAsync = async (id, payload) => await this.repo.updateAsync(id, payload);
}

