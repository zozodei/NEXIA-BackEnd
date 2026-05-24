import alumnoRepository from "../repositories/alumnoRepository.js"

export default class alumnoService{
    constructor(){
       console.log('Estoy en: alumnoService.constructor()');
        this.repo = new alumnoRepository();
    }    
    getAllAsync = async() => await this.repo.getAllAsync();
}



