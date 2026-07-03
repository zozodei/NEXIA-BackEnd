import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authController from './controllers/authController.js';
import alumnoController from './controllers/alumnoController.js';
import profesorController from './controllers/profesorController.js';
import gestorController from './controllers/gestorController.js';
import cursoController from './controllers/cursoController.js';
import materiaController from './controllers/materiaController.js';
import contenidoController from './controllers/contenidoController.js';
import tipoContenidoController from './controllers/tipoContenidoController.js';
import institucionController from './controllers/institucionController.js';
import comunicadoController from './controllers/comunicadoController.js';
import trabajoPracticoController from './controllers/trabajoPracticoController.js';
import bimestreController from './controllers/bimestreController.js';
import calificacionController from './controllers/calificacionController.js';
import boletinController from './controllers/boletinController.js';
import iaController from './controllers/iaController.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Backend funcionando correctamente'
  });
});

app.use('/api/auth', authController);
app.use('/api/alumnos', alumnoController);
app.use('/api/profesores', profesorController);
app.use('/api/gestor', gestorController);
app.use('/api/cursos', cursoController);
app.use('/api/materias', materiaController);
app.use('/api/contenidos', contenidoController);
app.use('/api/tipos-contenido', tipoContenidoController);
app.use('/api/instituciones', institucionController);
app.use('/api/comunicados', comunicadoController);
app.use('/api/trabajos-practicos', trabajoPracticoController);
app.use('/api/bimestres', bimestreController);
app.use('/api/calificaciones', calificacionController);
app.use('/api/boletin', boletinController);
app.use('/api/ia', iaController);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada'
  });
});

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);

  res.status(500).json({
    ok: false,
    message: 'Error interno del servidor',
    error: err.message
  });
});

app.listen(PORT, () => {
  const caStatus = process.env.NODE_EXTRA_CA_CERTS
    ? `certificado extra cargado (${process.env.NODE_EXTRA_CA_CERTS})`
    : 'SIN certificado extra — si el proxy de la red intercepta HTTPS, la IA va a fallar. Usá "npm run dev".';
  console.log(`Tutor IA — TLS: ${caStatus}`);
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});