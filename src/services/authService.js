import AuthRepository from '../repositories/authRepository.js';

export default class AuthService {
  constructor() {
    this.repo = new AuthRepository();
  }

  loginAsync = async ({ institucion_id, dni, password, rol }) => {
    const rolNormalizado = rol.toUpperCase();

    if (rolNormalizado === 'GESTOR') {
      return await this.repo.loginGestorAsync({
        institucion_id,
        dni,
        password
      });
    }

    if (rolNormalizado === 'ALUMNO' || rolNormalizado === 'PROFESOR') {
      return await this.repo.loginUsuarioAsync({
        institucion_id,
        dni,
        password,
        rol: rolNormalizado
      });
    }

    return null;
  };
}