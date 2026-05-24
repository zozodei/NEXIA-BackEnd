import contenidoRepository from "../repositories/contenidoRepository.js"

export default class contenidoService{
	constructor(){
	   console.log('Estoy en: contenidoService.constructor()');
		this.repo = new contenidoRepository();
	}

	getAllAsync = async() => await this.repo.getAllAsync();

	getByIdAsync = async (id) => await this.repo.getByIdAsync(id);

	createAsync = async (payload) => await this.repo.createAsync(payload);

	updateAsync = async (id, payload) => await this.repo.updateAsync(id, payload);
}
