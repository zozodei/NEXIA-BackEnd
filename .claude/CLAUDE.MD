Sobre el proyecto

NEXIA es el backend de una plataforma educativa. El proyecto está desarrollado con Node.js y sigue una arquitectura en capas para separar las responsabilidades entre la lógica del negocio, el acceso a los datos y la exposición de la API.

Este documento está destinado a servir como contexto para asistentes de IA (Claude, ChatGPT, Cursor, Copilot, etc.) que trabajen sobre este repositorio.

Arquitectura

El proyecto utiliza la siguiente estructura:

Route → Controller → Service → Repository → Database
Reglas de cada capa
Routes
Definen los endpoints.
Reciben las solicitudes HTTP.
Derivan la petición al controlador correspondiente.
No deben contener lógica del negocio.
Controllers
Reciben req y res.
Extraen parámetros, el cuerpo de la petición y los datos del usuario.
Llaman a los servicios.
Devuelven la respuesta HTTP.
No deben acceder directamente a la base de datos.
Services
Contienen toda la lógica del negocio.
Validan reglas específicas del sistema.
Coordinan la comunicación entre diferentes entidades.
No deben ejecutar consultas SQL.
Repositories
Son la única capa autorizada para interactuar con la base de datos.
Ejecutan consultas.
Insertan, actualizan y eliminan registros.
No deben contener lógica del negocio.
Convenciones del código
Antes de crear una nueva funcionalidad

Siempre seguir este orden:

Crear la ruta.
Crear el controlador.
Crear el servicio.
Crear el repositorio.
Implementar la consulta correspondiente.
Probar el endpoint.
Convenciones de nombres
usuarios.routes.js
usuarios.controller.js
usuarios.service.js
usuarios.repository.js
Buenas prácticas
Mantener una única responsabilidad por archivo.
Reutilizar código siempre que sea posible.
No duplicar lógica.
Priorizar funciones pequeñas y descriptivas.
Utilizar nombres claros para variables, funciones y archivos.
Mantener la consistencia con el estilo existente del proyecto.
Respetar la arquitectura ya implementada.
Al modificar el código
No cambiar la estructura del proyecto.
No modificar nombres de carpetas.
No mover archivos entre capas.
No agregar dependencias sin una justificación clara.
Mantener la compatibilidad con el código existente.
Al generar código

El asistente debe:

Analizar primero el contexto del archivo.
Respetar los patrones ya existentes.
Seguir el mismo estilo del repositorio.
Generar código consistente con el resto del proyecto.
Evitar refactorizaciones innecesarias.
Explicar brevemente los cambios realizados.
Prioridades
Mantener la arquitectura.
Mantener la legibilidad.
Mantener la consistencia.
Minimizar cambios innecesarios.
Priorizar código simple y fácil de mantener.