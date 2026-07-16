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
    activo,
    foto_perfil_url,
    tema,
    idioma,
    notificaciones_email,
    fecha_actualizacion,
    fecha_creacion
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
    this.foto_perfil_url = foto_perfil_url;
    this.tema = tema;
    this.idioma = idioma;
    this.notificaciones_email = notificaciones_email;
    this.fecha_actualizacion = fecha_actualizacion;
    this.fecha_creacion = fecha_creacion;
  }
}