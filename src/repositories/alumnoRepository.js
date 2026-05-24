import pool from '../database/db.js';


export default class AlumnoRepository {

    constructor() {
        console.log('Estoy en: AlumnoRepository.constructor()');
    } 

    getAllAsync = async () =>{
        try{
            const result  = await pool.query("SELECT * FROM alumno")
            return result.rows;
        }catch(error){
            console.log(error); return null;
        }
    }
}