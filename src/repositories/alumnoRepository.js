import pool from '../database/db.js';


export default class alumnoRepository {

    constructor() {
        console.log('Estoy en: AlumnoRepository.constructor()');
    } 

    getAllAsync = async () =>{
        try{
            const result  = await pool.query("SELECT * FROM alumno")
        }catch(error){
            console.log(error); return null;
        }
    }
}