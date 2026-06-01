import AuthRepository from '../repositories/authRepository.js';

export default class AuthService {
  constructor() {
    this.repo = new AuthRepository();
  }

  loginAsync = async ({ institucion_id, dni, password }) => {
    const usuario = await this.repo.loginUsuarioAsync({
      institucion_id,
      dni,
      password
    });

    if (usuario) {
      return usuario;
    }

    const gestor = await this.repo.loginGestorAsync({
      institucion_id,
      dni,
      password
    });

    if (gestor) {
      return gestor;
    }

    const director = await this.repo.loginDirectorAsync({
      institucion_id,
      dni,
      password
    });

    if (director) {
      return director;
    }

    return null;
  };
}