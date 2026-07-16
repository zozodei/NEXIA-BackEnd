import bcrypt from 'bcryptjs';
import UsuarioRepository from '../repositories/usuarioRepository.js';

const TEMAS_VALIDOS = ['claro', 'oscuro'];
const IDIOMAS_VALIDOS = ['es', 'en'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;

// Error de dominio: el controller lo traduce a un 400 con su mensaje.
export class ValidacionError extends Error {}

export default class UsuarioService {
  constructor() {
    this.repo = new UsuarioRepository();
  }

  getPerfilAsync = (usuarioId) => this.repo.getPerfilByIdAsync(usuarioId);

  // Valida y normaliza sólo los campos presentes en el body (update parcial).
  updatePerfilAsync = async (usuarioId, body) => {
    const campos = {};

    if (body.nombre !== undefined) {
      const nombre = String(body.nombre).trim();
      if (!nombre) throw new ValidacionError('El nombre no puede quedar vacío');
      campos.nombre = nombre;
    }

    if (body.apellido !== undefined) {
      const apellido = String(body.apellido).trim();
      if (!apellido) throw new ValidacionError('El apellido no puede quedar vacío');
      campos.apellido = apellido;
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!EMAIL_RE.test(email)) throw new ValidacionError('El email no tiene un formato válido');
      campos.email = email;
    }

    if (body.tema !== undefined) {
      if (!TEMAS_VALIDOS.includes(body.tema)) {
        throw new ValidacionError("El tema debe ser 'claro' u 'oscuro'");
      }
      campos.tema = body.tema;
    }

    if (body.idioma !== undefined) {
      if (!IDIOMAS_VALIDOS.includes(body.idioma)) {
        throw new ValidacionError('El idioma seleccionado no está disponible');
      }
      campos.idioma = body.idioma;
    }

    if (body.notificaciones_email !== undefined) {
      campos.notificaciones_email = Boolean(body.notificaciones_email);
    }

    // foto_perfil_url llega ya resuelta desde el endpoint de subida; se acepta
    // tanto una URL como null (para quitar la foto).
    if (body.foto_perfil_url !== undefined) {
      campos.foto_perfil_url = body.foto_perfil_url || null;
    }

    return this.repo.updatePerfilAsync(usuarioId, campos);
  };

  cambiarPasswordAsync = async (usuarioId, passwordActual, passwordNueva) => {
    if (!passwordNueva || passwordNueva.length < PASSWORD_MIN) {
      throw new ValidacionError(`La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);
    }

    const hashActual = await this.repo.getPasswordHashAsync(usuarioId);
    if (!hashActual) throw new ValidacionError('Usuario no encontrado');

    const coincide = await bcrypt.compare(passwordActual || '', hashActual);
    if (!coincide) throw new ValidacionError('La contraseña actual es incorrecta');

    const nuevoHash = await bcrypt.hash(passwordNueva, 10);
    await this.repo.updatePasswordAsync(usuarioId, nuevoHash);
  };
}
