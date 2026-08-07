import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/database/db.js';
import { uploadToBucket, BUCKETS } from '../src/services/storageService.js';

// Sube a Supabase Storage los archivos que hoy están en la carpeta local
// /uploads y actualiza las columnas *_url de la base para que apunten a la
// nueva URL pública. Correr una sola vez: node scripts/migrar-uploads-a-supabase.js

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

const MIME_POR_EXT = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
};

const FILAS_A_MIGRAR = [
  { tabla: 'contenido', columna: 'archivo_url', bucket: BUCKETS.CONTENIDOS },
  { tabla: 'trabajo_practico', columna: 'archivo_url', bucket: BUCKETS.ENTREGABLES },
  { tabla: 'entrega', columna: 'archivo_url', bucket: BUCKETS.ENTREGABLES },
  { tabla: 'usuario', columna: 'foto_perfil_url', bucket: BUCKETS.AVATARS },
];

const extraerNombreArchivo = (url) => url.split('/uploads/').pop();

const migrarFila = async ({ tabla, columna, bucket }) => {
  const { rows } = await pool.query(
    `SELECT id, ${columna} FROM ${tabla} WHERE ${columna} LIKE '%/uploads/%'`
  );

  for (const row of rows) {
    const nombreArchivo = extraerNombreArchivo(row[columna]);
    const rutaLocal = path.join(uploadsDir, nombreArchivo);

    if (!fs.existsSync(rutaLocal)) {
      console.warn(`⚠ ${tabla}#${row.id}: no se encontró el archivo local "${nombreArchivo}", se omite`);
      continue;
    }

    const buffer = fs.readFileSync(rutaLocal);
    const ext = path.extname(nombreArchivo).toLowerCase();
    const mimetype = MIME_POR_EXT[ext] || 'application/octet-stream';

    const nuevaUrl = await uploadToBucket(bucket, {
      originalname: nombreArchivo,
      buffer,
      mimetype,
    });

    await pool.query(`UPDATE ${tabla} SET ${columna} = $1 WHERE id = $2`, [nuevaUrl, row.id]);
    console.log(`✓ ${tabla}#${row.id}: ${nombreArchivo} -> ${nuevaUrl}`);
  }
};

const migrar = async () => {
  for (const objetivo of FILAS_A_MIGRAR) {
    await migrarFila(objetivo);
  }
  await pool.end();
};

migrar()
  .then(() => console.log('Listo.'))
  .catch((err) => {
    console.error('Error en la migración:', err.message);
    process.exit(1);
  });
