import supabase from '../src/database/supabaseClient.js';
import { BUCKETS } from '../src/services/storageService.js';

// Crea (si no existen) los buckets públicos usados para guardar archivos.
// Correr una sola vez: node scripts/crear-buckets-supabase.js

const BUCKET_CONFIG = [
  {
    id: BUCKETS.CONTENIDOS,
    fileSizeLimit: '20MB',
    allowedMimeTypes: ['application/pdf', 'application/octet-stream'],
  },
  {
    id: BUCKETS.ENTREGABLES,
    fileSizeLimit: '20MB',
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
    ],
  },
  {
    id: BUCKETS.AVATARS,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
];

const crear = async () => {
  for (const { id, fileSizeLimit, allowedMimeTypes } of BUCKET_CONFIG) {
    const { error } = await supabase.storage.createBucket(id, {
      public: true,
      fileSizeLimit,
      allowedMimeTypes,
    });

    if (error && !/already exists/i.test(error.message)) {
      throw error;
    }

    console.log(error ? `= "${id}" ya existía` : `✓ "${id}" creado`);
  }
};

crear()
  .then(() => console.log('Listo.'))
  .catch((err) => {
    console.error('Error creando buckets:', err.message);
    process.exit(1);
  });
