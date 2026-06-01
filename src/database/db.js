import pg from 'pg';
// pg  es postgressql, es un cliente de node para conectarse a bases de datos postgresql


import dotenv from 'dotenv';
// dotenv es una biblioteca que carga variables de entorno desde un archivo .env en process.env. Esto es útil para mantener las credenciales y configuraciones sensibles fuera del código fuente.
//nosotros en .env guardamos la url de la base de datos 

//CHICOS ACUERDENSE DEL .ENV, NO SE SUBE A GITHUB!!!!!

dotenv.config();  
// esto tmb es del .env, carga lo que esta en el archivo .env a process.env para que podamos usarlo en nuestro código

const { Pool } = pg;
// Pool gestiona las conexiones con la base de datos (mas eficiente cada vez que queremos acceder a la BD) 


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log(process.env.DATABASE_URL);

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error adquiriendo el cliente', err.stack);
  }

  console.log('Conexión exitosa a Supabase');
  release();
});

export default pool;