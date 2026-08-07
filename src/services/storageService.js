import supabase from '../database/supabaseClient.js';

// Buckets públicos: mismo modelo de acceso que tenía la carpeta /uploads
// (cualquiera con la URL puede leer el archivo; subir/borrar sigue requiriendo
// la service_role key, o sea que solo el backend puede escribir).
export const BUCKETS = {
  CONTENIDOS: 'contenidos',
  ENTREGABLES: 'entregables',
  AVATARS: 'avatars',
};

const sanitizeFileName = (originalName) =>
  originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

// Sube un buffer (req.file.buffer, con multer en memoryStorage) a un bucket
// de Supabase Storage y devuelve la URL pública del archivo.
export const uploadToBucket = async (bucket, file, prefix = '') => {
  const path = `${prefix}${Date.now()}-${sanitizeFileName(file.originalname)}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Borra un archivo a partir de su URL pública. Best-effort: si la URL no
// pertenece a este bucket o el borrado falla, no corta el flujo principal
// (la fila de la base ya se actualizó; un archivo huérfano no es crítico).
export const deleteFromBucket = async (bucket, publicUrl) => {
  if (!publicUrl) return;

  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const path = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error(`No se pudo borrar "${path}" del bucket "${bucket}":`, error.message);
};
