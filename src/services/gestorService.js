import gestorRepository from "../repositories/gestorRepository.js"

export default class gestorService{
	constructor(){
	   console.log('Estoy en: gestorService.constructor()');
		this.repo = new gestorRepository();
	}

	getAllAsync = async() => await this.repo.getAllAsync();

	getByIdAsync = async (id) => await this.repo.getByIdAsync(id);

	createAsync = async (payload) => await this.repo.createAsync(payload);

	updateAsync = async (id, payload) => await this.repo.updateAsync(id, payload);
}

