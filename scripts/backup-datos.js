/* Vuelca todas las tablas a un JSON con timestamp, para poder restaurar
   si un seed o una limpieza sale mal. Uso: node scripts/backup-datos.js */

import fs from 'node:fs';
import path from 'node:path';
import pool from '../src/database/db.js';

const TABLAS = [
  'institucion', 'personalizacion', 'gestor', 'director', 'especialidad',
  'usuario', 'coordinador', 'profesor', 'curso', 'alumno', 'materia',
  'curso_materia', 'profe_curso_materia', 'tipo_contenido', 'contenido',
  'comunicado', 'trabajo_practico', 'entrega', 'bimestre', 'calificacion',
  'clase', 'asistencia', 'apunte', 'evento_calendario', 'estudio_sesion',
  'estudio_objetivo', 'mazo', 'tarjeta', 'mapa_conceptual'
];

const backup = {};

for (const tabla of TABLAS) {
  const result = await pool.query(`SELECT * FROM ${tabla}`);
  backup[tabla] = result.rows;
  console.log(`${tabla.padEnd(22)} ${result.rows.length}`);
}

const sello = new Date().toISOString().replace(/[:.]/g, '-');
const destino = path.join(process.cwd(), 'backups', `backup-${sello}.json`);

fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify(backup, null, 2));

console.log(`\nBackup guardado en: ${destino}`);
process.exit(0);
