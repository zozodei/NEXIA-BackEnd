export default class Usuario {
  constructor({
    id,
    institucion_id,
    nombre,
    apellido,
    email,
    password,
    dni,
    rol,
    activo
  }) {
    this.id = id;
    this.institucion_id = institucion_id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.password = password;
    this.dni = dni;
    this.rol = rol;
    this.activo = activo;
  }
}