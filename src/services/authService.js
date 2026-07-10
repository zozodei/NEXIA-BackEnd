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

  // La institución se deriva del DNI. Como el mismo DNI podría existir en más
  // de una institución (alumno en una, docente en otra…), se reúnen todos los
  // candidatos y se desambigua con la contraseña: se loguea al único cuya
  // contraseña coincide. El orden usuario → gestor → director define la
  // prioridad ante un empate improbable.
  loginAsync = async ({ dni, password }) => {
    const candidatos = [
      ...await this.repo.loginUsuarioAsync({ dni }),
      ...await this.repo.loginGestorAsync({ dni }),
      ...await this.repo.loginDirectorAsync({ dni })
    ];

    for (const candidato of candidatos) {
      if (candidato?.password && await bcrypt.compare(password, candidato.password)) {
        return this.#buildResponse(candidato);
      }
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
