import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AuthRepository from '../repositories/authRepository.js';

// Access token corto + refresh token largo con rotación.
// El refresh usa un secreto propio (JWT_REFRESH_SECRET) con fallback
// derivado del JWT_SECRET para no requerir configuración extra.
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}.refresh`;

export default class AuthService {
  constructor() {
    this.repo = new AuthRepository();
  }

  loginAsync = async ({ institucion_id, dni, password }) => {
    const usuario = await this.repo.loginUsuarioAsync({ institucion_id, dni });
    if (usuario && await bcrypt.compare(password, usuario.password)) {
      return this.#buildResponse(usuario);
    }

    const gestor = await this.repo.loginGestorAsync({ institucion_id, dni });
    if (gestor && await bcrypt.compare(password, gestor.password)) {
      return this.#buildResponse(gestor);
    }

    const director = await this.repo.loginDirectorAsync({ institucion_id, dni });
    if (director && await bcrypt.compare(password, director.password)) {
      return this.#buildResponse(director);
    }

    return null;
  };

  /**
   * Valida un refresh token y devuelve un nuevo par access+refresh (rotación).
   * Devuelve null si el token es inválido, expiró o no es de tipo refresh.
   */
  refreshAsync = (refreshToken) => {
    try {
      const decoded = jwt.verify(refreshToken, refreshSecret());
      if (decoded.type !== 'refresh') return null;

      // eslint-disable-next-line no-unused-vars
      const { iat, exp, type, ...payload } = decoded;
      return this.#buildTokens(payload);
    } catch {
      return null;
    }
  };

  #buildTokens = (payload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      refreshSecret(),
      { expiresIn: REFRESH_EXPIRES }
    );
    return { token, refreshToken };
  };

  #buildResponse = (userData) => {
    const { password, ...payload } = userData;
    return { ...this.#buildTokens(payload), user: payload };
  };
}
