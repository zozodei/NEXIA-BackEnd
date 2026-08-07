import multer from 'multer';
import path from 'path';

// memoryStorage: el archivo llega como buffer en req.file.buffer y se sube
// directo a Supabase Storage (ver storageService.js), sin tocar el disco.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    const ok   = ext === '.pdf' || mime === 'application/pdf' || mime === 'application/octet-stream';
    if (ok) cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF'));
  },
});

export default upload;
