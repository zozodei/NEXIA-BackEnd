import alumnoRepository from "../repositories/alumnoRepository.js"

export default class alumnoService{
    constructor(){
       console.log('Estoy en: alumnoService.constructor()');
        this.repo = new alumnoRepository();
    }    
    getAllAsync = async() => await this.repo.getAllAsync();

    getByIdAsync = async (id) => await this.repo.getByIdAsync(id);

    createAsync = async (payload) => await this.repo.createAsync(payload);

    updateAsync = async (id, payload) => await this.repo.updateAsync(id, payload);
}



