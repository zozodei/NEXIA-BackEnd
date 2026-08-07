import multer from 'multer';
import path from 'path';

const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip'];

const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream'
];

// Usado tanto para la consigna que sube el profesor como para la entrega del
// alumno. El archivo llega como buffer (memoryStorage) y se sube a Supabase
// Storage en el controller.
const uploadEntregable = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    const ok   = ALLOWED_EXT.includes(ext) || ALLOWED_MIME.includes(mime);
    if (ok) cb(null, true);
    else cb(new Error('Formato no permitido. Se aceptan PDF, Word, imágenes (JPG/PNG) o ZIP'));
  },
});

export default uploadEntregable;
