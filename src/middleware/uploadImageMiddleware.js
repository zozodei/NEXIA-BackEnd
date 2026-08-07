import multer from 'multer';

// Middleware de subida de imágenes (fotos de perfil). El archivo llega como
// buffer (memoryStorage) y se sube a Supabase Storage en el controller.

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype.toLowerCase())) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  },
});

export default uploadImage;
