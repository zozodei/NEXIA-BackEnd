import {alumnoRepository} from "../repositories/alumnoRepository.js"

export default class alumnoService{
    constructor(){
       console.log('Estoy en: alumnoService.constructor()');
        this.repo = new alumnoRepository();
    }    
    getAll = async() => await this.repo.getAllAsync();
}



