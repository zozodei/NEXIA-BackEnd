import profesorRepository from "../repositories/profesorRepository.js"

export default class profesorService{
	constructor(){
	   console.log('Estoy en: profesorService.constructor()');
		this.repo = new profesorRepository();
	}

	getAllAsync = async() => await this.repo.getAllAsync();

	getByIdAsync = async (id) => await this.repo.getByIdAsync(id);

	createAsync = async (payload) => await this.repo.createAsync(payload);

	updateAsync = async (id, payload) => await this.repo.updateAsync(id, payload);
}
