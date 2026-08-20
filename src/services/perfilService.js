import bcrypt from 'bcryptjs';
import PerfilRepository from '../repositories/perfilRepository.js';
import { uploadToBucket, deleteFromBucket, BUCKETS } from './storageService.js';

const TEMAS_VALIDOS = ['claro', 'oscuro'];
const IDIOMAS_VALIDOS = ['es', 'en'];
const GENEROS_VALIDOS = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'];
// Espejo del catálogo del front (src/utils/avatar.ts). Los valores viejos van
// primero y NO se quitan nunca: una config ya guardada tiene que seguir siendo
// válida aunque el catálogo crezca.
const HAIR_STYLES = [
  'corto', 'medio', 'largo', 'rizado', 'rapado',
  'ondulado', 'bob', 'coleta', 'rodete', 'trenzas',
];
const GLASSES_VALIDOS = ['redondos', 'cuadrados', 'sol', 'aviador', 'gato'];
const HATS_VALIDOS = ['nexia', 'gorra', 'vincha', 'beanie', 'auriculares', 'birrete'];
const VELLOS_VALIDOS = ['barba', 'candado', 'bigote'];
const MARCAS_VALIDAS = ['pecas', 'lunar'];
const FONDOS_VALIDOS = ['aurora', 'menta', 'atardecer', 'indigo', 'rosa', 'liso'];
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const BIOGRAFIA_MAX = 300;
const PASSWORD_MIN = 8;
const PASSWORD_RE = /^(?=.*\d).{8,}$/; // mínimo 8 caracteres, al menos 1 número

// Error de dominio: el controller lo traduce a un 400 con su mensaje.
export class ValidacionError extends Error {}

const validarHex = (valor, campo) => {
  if (typeof valor !== 'string' || !HEX_RE.test(valor)) {
    throw new ValidacionError(`"${campo}" debe ser un color hexadecimal válido (#RRGGBB)`);
  }
};

const validarOpcionalDeLista = (valor, campo, lista) => {
  if (valor === null || valor === undefined) return null;
  if (!lista.includes(valor)) {
    throw new ValidacionError(`"${campo}" debe ser uno de: ${lista.join(', ')}, o null`);
  }
  return valor;
};

// Valida la estructura completa de avatar_config y devuelve una copia
// normalizada (sólo las claves conocidas, para no persistir basura en el jsonb).
const validarAvatarConfig = (avatar) => {
  if (!avatar || typeof avatar !== 'object' || Array.isArray(avatar)) {
    throw new ValidacionError('avatar_config debe ser un objeto');
  }

  validarHex(avatar.skin, 'skin');

  if (!avatar.hair || typeof avatar.hair !== 'object') {
    throw new ValidacionError('"hair" debe ser un objeto con "style" y "color"');
  }
  if (!HAIR_STYLES.includes(avatar.hair.style)) {
    throw new ValidacionError(`"hair.style" debe ser uno de: ${HAIR_STYLES.join(', ')}`);
  }
  validarHex(avatar.hair.color, 'hair.color');

  validarHex(avatar.eyes, 'eyes');

  const accessories = avatar.accessories && typeof avatar.accessories === 'object' ? avatar.accessories : {};
  const glasses = validarOpcionalDeLista(accessories.glasses ?? null, 'accessories.glasses', GLASSES_VALIDOS);
  const hat = validarOpcionalDeLista(accessories.hat ?? null, 'accessories.hat', HATS_VALIDOS);

  validarHex(avatar.shirt_color, 'shirt_color');

  // Campos agregados después. Son opcionales a propósito: un cliente viejo
  // sigue guardando sin ellos y una config sin ellos sigue siendo válida.
  const facialHair = validarOpcionalDeLista(avatar.facial_hair ?? null, 'facial_hair', VELLOS_VALIDOS);
  const marks = validarOpcionalDeLista(avatar.marks ?? null, 'marks', MARCAS_VALIDAS);
  const backdrop = validarOpcionalDeLista(avatar.backdrop ?? null, 'backdrop', FONDOS_VALIDOS) ?? 'aurora';

  return {
    skin: avatar.skin,
    hair: { style: avatar.hair.style, color: avatar.hair.color },
    eyes: avatar.eyes,
    accessories: { glasses, hat },
    shirt_color: avatar.shirt_color,
    facial_hair: facialHair,
    marks,
    backdrop,
  };
};

export default class PerfilService {
  constructor() {
    this.repo = new PerfilRepository();
  }

  getPerfilAsync = (usuarioId) => this.repo.getByIdAsync(usuarioId);

  // Valida y normaliza sólo los campos presentes en el body (update parcial).
  // Cualquier campo fuera de la whitelist (rol, dni, email, password, etc.)
  // se ignora silenciosamente: no rompe la request, simplemente no se toca.
  updateDatosAsync = async (usuarioId, body) => {
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

    if (body.telefono !== undefined) {
      campos.telefono = body.telefono === null ? null : String(body.telefono).trim();
    }

    if (body.fecha_nacimiento !== undefined) {
      if (body.fecha_nacimiento === null) {
        campos.fecha_nacimiento = null;
      } else {
        const valor = String(body.fecha_nacimiento);
        const fecha = new Date(valor);
        if (!FECHA_RE.test(valor) || Number.isNaN(fecha.getTime())) {
          throw new ValidacionError('La fecha de nacimiento no es válida (formato esperado: YYYY-MM-DD)');
        }
        if (fecha.getTime() > Date.now()) {
          throw new ValidacionError('La fecha de nacimiento no puede ser futura');
        }
        campos.fecha_nacimiento = valor;
      }
    }

    if (body.biografia !== undefined) {
      const biografia = body.biografia === null ? '' : String(body.biografia);
      if (biografia.length > BIOGRAFIA_MAX) {
        throw new ValidacionError(`La biografía no puede superar los ${BIOGRAFIA_MAX} caracteres`);
      }
      campos.biografia = biografia;
    }

    if (body.genero !== undefined) {
      if (body.genero !== null && !GENEROS_VALIDOS.includes(body.genero)) {
        throw new ValidacionError(`El género debe ser uno de: ${GENEROS_VALIDOS.join(', ')}, o null`);
      }
      campos.genero = body.genero;
    }

    if (body.direccion !== undefined) {
      campos.direccion = body.direccion === null ? null : String(body.direccion).trim();
    }

    if (body.ciudad !== undefined) {
      campos.ciudad = body.ciudad === null ? null : String(body.ciudad).trim();
    }

    if (body.pais !== undefined) {
      campos.pais = body.pais === null ? null : String(body.pais).trim();
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

    return this.repo.updateDatosAsync(usuarioId, campos);
  };

  setAvatarAsync = async (usuarioId, avatarConfigBody) => {
    const avatarConfig = validarAvatarConfig(avatarConfigBody);

    const actual = await this.repo.getImagenActualAsync(usuarioId);
    const perfil = await this.repo.setAvatarConfigAsync(usuarioId, avatarConfig);

    if (actual?.foto_perfil_url) {
      await deleteFromBucket(BUCKETS.AVATARS, actual.foto_perfil_url);
    }

    return perfil;
  };

  setFotoAsync = async (usuarioId, file) => {
    const actual = await this.repo.getImagenActualAsync(usuarioId);

    const url = await uploadToBucket(BUCKETS.AVATARS, file);
    const perfil = await this.repo.setFotoUrlAsync(usuarioId, url);

    if (actual?.foto_perfil_url) {
      await deleteFromBucket(BUCKETS.AVATARS, actual.foto_perfil_url);
    }

    return perfil;
  };

  limpiarImagenAsync = async (usuarioId) => {
    const actual = await this.repo.getImagenActualAsync(usuarioId);
    const perfil = await this.repo.limpiarImagenAsync(usuarioId);

    if (actual?.foto_perfil_url) {
      await deleteFromBucket(BUCKETS.AVATARS, actual.foto_perfil_url);
    }

    return perfil;
  };

  cambiarPasswordAsync = async (usuarioId, passwordActual, passwordNueva) => {
    if (!passwordNueva || !PASSWORD_RE.test(passwordNueva)) {
      throw new ValidacionError(
        `La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres e incluir al menos un número`
      );
    }

    const hashActual = await this.repo.getPasswordHashAsync(usuarioId);
    if (!hashActual) throw new ValidacionError('Usuario no encontrado');

    const coincide = await bcrypt.compare(passwordActual || '', hashActual);
    if (!coincide) throw new ValidacionError('La contraseña actual es incorrecta');

    const nuevoHash = await bcrypt.hash(passwordNueva, 10);
    await this.repo.updatePasswordAsync(usuarioId, nuevoHash);
  };
}
