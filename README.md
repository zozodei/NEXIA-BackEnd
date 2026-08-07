[Nexia Backend (2).md](https://github.com/user-attachments/files/30830286/Nexia.Backend.2.md)
# Nexia Backend

> **Backend de Nexia, una plataforma educativa virtual para centralizar la gestión académica, la comunicación y el acompañamiento del aprendizaje.**

Nexia es una plataforma educativa desarrollada para instituciones educativas, cuyo objetivo es centralizar en un único entorno las herramientas necesarias para la gestión académica, la comunicación institucional y el seguimiento del aprendizaje.

Este repositorio contiene el **backend de Nexia**, responsable de la lógica de negocio, la gestión de usuarios y permisos, la persistencia de datos, el procesamiento de archivos, la comunicación con servicios externos y la integración con Nexia IA.

El proyecto fue desarrollado como trabajo final por un equipo de cinco estudiantes de la especialidad Informática de **ORT Argentina**, combinando desarrollo backend y frontend, diseño UX/UI, bases de datos, testing, seguridad, inteligencia artificial y planificación de producto.

---

## Índice

- [Sobre Nexia](#sobre-nexia)
- [Qué problema busca resolver](#qué-problema-busca-resolver)
- [Funcionalidades principales](#funcionalidades-principales)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo de una petición](#flujo-de-una-petición)
- [Usuarios, autenticación y roles](#usuarios-autenticación-y-roles)
- [Gestión académica](#gestión-académica)
- [Base de datos](#base-de-datos)
- [Comunicación con el frontend](#comunicación-con-el-frontend)
- [Gestión de archivos](#gestión-de-archivos)
- [Nexia IA](#nexia-ia)
- [Seguridad](#seguridad)
- [Validación y respuestas](#validación-y-respuestas)
- [Testing](#testing)
- [Multiinstitución](#multiinstitución)
- [Stack tecnológico](#stack-tecnológico)
- [Instalación y configuración](#instalación-y-configuración)
- [Ejecución](#ejecución)
- [Metodología de trabajo](#metodología-de-trabajo)
- [GitHub y colaboración](#github-y-colaboración)
- [Uso de inteligencia artificial](#uso-de-inteligencia-artificial)
- [Equipo](#equipo)
- [Estado del proyecto](#estado-del-proyecto)
- [Próximos pasos](#próximos-pasos)

---

# Sobre Nexia

Nexia funciona como un **campus virtual integral** para instituciones educativas.

La plataforma contempla diferentes tipos de usuarios y adapta las funcionalidades disponibles según el rol de cada persona.

Los principales roles son:

- **Alumno**
- **Profesor**
- **Gestor**

Además, el backend contempla perfiles administrativos adicionales, como directores y coordinadores.

El backend es el encargado de aplicar las reglas de negocio que permiten que cada usuario pueda acceder y modificar únicamente la información correspondiente a sus permisos.

---

# Qué problema busca resolver

En muchas instituciones educativas, la información se encuentra distribuida entre diferentes sistemas para materias, contenidos, calificaciones, trabajos prácticos, comunicación y administración.

Nexia busca centralizar estas funcionalidades en una única plataforma.

El backend conecta los diferentes dominios de la aplicación y mantiene la información académica, administrativa y de los usuarios dentro de una estructura común.

Entre las principales áreas administradas se encuentran:

- Usuarios y roles.
- Instituciones.
- Cursos y materias.
- Contenidos educativos.
- Trabajos prácticos.
- Entregas.
- Calificaciones.
- Boletines.
- Comunicados.
- Eventos y calendario.
- Notificaciones.
- Mensajería.
- Personalización institucional.
- Inteligencia artificial.

---

# Funcionalidades principales

El backend proporciona la infraestructura necesaria para las principales funcionalidades de Nexia.

### Alumnos

Los alumnos pueden acceder a la información correspondiente a sus materias y participar de los distintos procesos académicos de la plataforma.

Entre otras funcionalidades:

- Consulta de materias.
- Acceso a contenidos.
- Visualización de apuntes.
- Trabajos prácticos.
- Entrega de trabajos.
- Consulta de calificaciones.
- Boletines.
- Calendario.
- Comunicados.
- Mensajería.
- Nexia IA.

### Profesores

Los profesores cuentan con herramientas para administrar diferentes aspectos de sus materias.

Entre ellas:

- Gestión de materias asignadas.
- Creación y administración de contenidos.
- Creación de trabajos prácticos.
- Corrección de entregas.
- Carga de calificaciones.
- Consulta de información académica.

### Gestores y perfiles administrativos

Los usuarios administrativos pueden realizar tareas relacionadas con la gestión institucional.

Entre ellas:

- Creación de alumnos.
- Creación de profesores.
- Asignación de materias.
- Gestión de información institucional.
- Administración de comunicados.

---

# Arquitectura

El backend utiliza una **arquitectura multicapa orientada al dominio**.

La estructura separa las principales responsabilidades de la aplicación en diferentes capas:

```text
                    ┌──────────────────────┐
                    │     HTTP Request     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Middleware      │
                    │ Auth / Roles / Files │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Controllers      │
                    │ HTTP / Responses     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Services       │
                    │    Business Logic    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Repositories     │
                    │    Data Access       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      PostgreSQL      │
                    │   Relational DB      │
                    └──────────────────────┘
```

Esta separación permite reducir el acoplamiento entre la lógica de negocio y la persistencia de datos.

Uno de los patrones utilizados es el **Repository Pattern**, mediante el cual los services delegan las operaciones de acceso a datos a repositories específicos.

---

# Estructura del proyecto

La estructura principal dentro de `src/` está organizada de la siguiente manera:

```text
src/
├── controllers/
├── services/
├── repositories/
├── entities/
├── database/
├── middleware/
├── helpers/
└── app.js
```

## Controllers

Los controllers reciben las peticiones HTTP y generan las respuestas correspondientes.

```text
src/controllers/
```

Existen controllers separados para diferentes dominios del sistema, entre ellos:

```text
authController.js
alumnoController.js
profesorController.js
gestorController.js
directorController.js
coordinadorController.js
materiaController.js
contenidoController.js
trabajoPracticoController.js
calificacionController.js
boletinController.js
comunicadoController.js
eventoController.js
iaController.js
institucionController.js
```

La separación por dominio facilita la organización y el mantenimiento del código.

---

## Services

Los services contienen la lógica de negocio de la aplicación.

```text
src/services/
```

Esta capa permite evitar que las reglas de negocio queden directamente dentro de los controllers.

Por ejemplo:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

---

## Repositories

Los repositories encapsulan el acceso a PostgreSQL.

```text
src/repositories/
```

Los services pueden utilizar repositories para realizar operaciones de persistencia sin tener que manejar directamente los detalles de las consultas SQL.

Algunos ejemplos son:

```text
coordinadorRepository.js
directorRepository.js
curso_materiaRepository.js
profe_curso_materiaRepository.js
```

---

## Entities

Las entidades representan los principales modelos de información utilizados por el sistema.

```text
src/entities/
```

Entre ellas se encuentran:

```text
Alumno
Apunte
Bimestre
Boletin
Calificacion
Comunicado
Contenido
Coordinador
Curso
Director
Especialidad
Evento
Gestor
Institucion
Materia
Notificacion
Personalizacion
Profesor
TipoContenido
TrabajoPractico
Usuario
```

---

## Database

La conexión con PostgreSQL se configura en:

```text
src/database/db.js
```

El backend utiliza el paquete `pg` para conectarse a PostgreSQL mediante un pool de conexiones.

Esto permite reutilizar conexiones y administrar las operaciones de acceso a la base de datos.

---

## Middleware

Los middlewares permiten procesar las peticiones antes de que lleguen a los controllers.

```text
src/middleware/
```

Entre sus responsabilidades se encuentran:

- Autenticación.
- Autorización por roles.
- Procesamiento de archivos.
- Procesamiento de imágenes.
- Procesamiento de entregas.

Algunos de los middlewares identificados son:

```text
authMiddleware.js
rolesMiddleware.js
uploadMiddleware.js
uploadImageMiddleware.js
uploadEntregableMiddleware.js
```

---

## Helpers

Los helpers contienen funcionalidades reutilizables y transversales.

```text
src/helpers/
```

Entre ellos:

```text
validationHelper.js
responseHelper.js
```

`validationHelper.js` centraliza mecanismos de validación, mientras que `responseHelper.js` permite estandarizar la generación de respuestas.

---

# Flujo de una petición

Una petición típica sigue un flujo similar al siguiente:

```text
Frontend
   │
   ▼
HTTP Request
   │
   ▼
Middleware
   │
   ├── Autenticación
   ├── Autorización
   └── Procesamiento de archivos
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Repository
   │
   ▼
PostgreSQL
   │
   ▼
Repository
   │
   ▼
Service
   │
   ▼
Controller
   │
   ▼
HTTP Response
   │
   ▼
Frontend
```

Esta separación permite que cada componente se concentre en una responsabilidad específica.

---

# Usuarios, autenticación y roles

Nexia utiliza un sistema de usuarios basado en roles.

Los principales roles de la plataforma son:

| Rol             | Función principal                                           |
| --------------- | ----------------------------------------------------------- |
| **Alumno**      | Utilización de las herramientas académicas y de aprendizaje |
| **Profesor**    | Gestión de contenidos, trabajos y calificaciones            |
| **Gestor**      | Administración institucional                                |
| **Director**    | Funciones administrativas y de gestión                      |
| **Coordinador** | Funciones de coordinación académica                         |

La autenticación y autorización se implementan mediante middlewares.

```text
src/middleware/authMiddleware.js
src/middleware/rolesMiddleware.js
```

El proyecto utiliza **JSON Web Tokens (JWT)** para la autenticación.

La dependencia utilizada es:

```json
"jsonwebtoken": "^9.0.3"
```

El procesamiento seguro de contraseñas utiliza:

```json
"bcryptjs": "^3.0.3"
```

De esta manera, la contraseña no necesita almacenarse directamente en texto plano.

La autorización se aplica antes de ejecutar determinadas operaciones, permitiendo restringir funcionalidades según el rol del usuario.

---

# Gestión académica

La lógica académica es uno de los principales dominios del backend.

## Cursos y materias

El sistema contempla entidades como:

```text
Curso
Materia
Especialidad
```

Además, utiliza relaciones intermedias para representar relaciones muchos-a-muchos.

Por ejemplo:

```text
Curso ───────── Materia
  │
  └──────────── Profesor
```

Estas relaciones son gestionadas mediante repositories específicos.

---

## Contenidos

Los contenidos educativos se gestionan mediante controllers y services específicos.

Entre los componentes relacionados se encuentran:

```text
contenidoController.js
tipoContenidoController.js
```

Esto permite administrar diferentes tipos de recursos educativos dentro de las materias.

---

## Trabajos prácticos

El backend administra el ciclo de vida de los trabajos prácticos.

Entre las operaciones soportadas se encuentran:

- Creación.
- Gestión.
- Entrega.
- Consulta.
- Corrección.
- Calificación.

El dominio cuenta con:

```text
trabajoPracticoController.js
```

Las entregas también cuentan con un middleware específico:

```text
uploadEntregableMiddleware.js
```

---

## Calificaciones y boletines

La información académica relacionada con evaluaciones se organiza mediante entidades y controllers específicos:

```text
calificacionController.js
boletinController.js
bimestreController.js
```

Esto permite organizar las calificaciones y su relación con los períodos académicos.

---

# Base de datos

Nexia utiliza **PostgreSQL** como sistema de gestión de base de datos.

La dependencia utilizada es:

```json
"pg": "^8.21.0"
```

La conexión se administra desde:

```text
src/database/db.js
```

El acceso a los datos se encuentra encapsulado principalmente mediante repositories.

## Modelo de datos

Entre las principales entidades se encuentran:

```text
Usuario
Alumno
Profesor
Gestor
Director
Coordinador
Institucion

Curso
Materia
Especialidad

Contenido
TipoContenido
TrabajoPractico
Calificacion
Boletin
Bimestre

Apunte
Comunicado
Evento
Notificacion
Personalizacion
```

El modelo utiliza relaciones entre entidades y tablas intermedias para representar estructuras académicas más complejas.

---

## Migraciones

El proyecto incluye scripts SQL y JavaScript relacionados con la migración y mantenimiento de datos.

Por ejemplo:

```text
scripts/migracion-config-usuario.sql
scripts/migrar-passwords.js
```

---

# Comunicación con el frontend

El backend funciona como API para el frontend de Nexia.

El frontend realiza peticiones HTTP y el backend:

1. Recibe la petición.
2. Valida la información.
3. Comprueba la autenticación.
4. Comprueba los permisos del usuario.
5. Ejecuta la lógica de negocio.
6. Consulta o modifica PostgreSQL.
7. Procesa archivos cuando corresponde.
8. Devuelve una respuesta.

La separación entre frontend y backend permite que cada aplicación tenga responsabilidades independientes.

---

# Gestión de archivos

Nexia permite gestionar archivos relacionados con diferentes funcionalidades.

Para ello utiliza **Multer**:

```json
"multer": "^2.2.0"
```

La subida se encuentra separada mediante distintos middlewares:

```text
uploadMiddleware.js
uploadImageMiddleware.js
uploadEntregableMiddleware.js
```

Esto permite diferenciar entre archivos generales, imágenes y entregas de trabajos prácticos.

Actualmente, los archivos se gestionan mediante el directorio:

```text
uploads/
```

---

# Nexia IA

Nexia incorpora una herramienta de inteligencia artificial integrada dentro de la plataforma.

La lógica correspondiente se encuentra separada del resto de los dominios:

```text
src/controllers/iaController.js
src/services/iaService.js
```

Para la integración con los servicios de Google se utiliza:

```json
"@google/genai": "^2.10.0"
```

Esto permite que el backend funcione como intermediario entre la interfaz de Nexia IA y el servicio de inteligencia artificial.

La integración está diseñada para mantener la comunicación con el proveedor de IA dentro de una capa específica, evitando mezclar esta lógica con los demás dominios de la aplicación.

---

# Seguridad

La seguridad se implementa mediante diferentes mecanismos.

## Autenticación

El backend utiliza JWT:

```json
"jsonwebtoken": "^9.0.3"
```

La autenticación se procesa mediante:

```text
authMiddleware.js
```

---

## Contraseñas

Las contraseñas son procesadas utilizando `bcryptjs`:

```json
"bcryptjs": "^3.0.3"
```

Esto permite almacenar contraseñas mediante hashes en lugar de texto plano.

---

## Autorización

La autorización se implementa mediante:

```text
rolesMiddleware.js
```

Este middleware permite restringir operaciones según el rol del usuario.

---

## CORS

El backend utiliza:

```json
"cors": "^2.8.6"
```

para gestionar las políticas de Cross-Origin Resource Sharing y permitir la comunicación entre el frontend y la API.

---

## Variables de entorno

El proyecto utiliza `dotenv`:

```json
"dotenv": "^17.4.2"
```

y proporciona un archivo:

```text
.env.example
```

Esto permite mantener las configuraciones sensibles fuera del código fuente.

Las credenciales reales y otros secretos no deberían incluirse directamente en el repositorio.

---

# Validación y respuestas

La aplicación cuenta con helpers destinados a centralizar responsabilidades comunes.

```text
src/helpers/validationHelper.js
src/helpers/responseHelper.js
```

La validación permite controlar la información recibida antes de procesarla, mientras que el helper de respuestas ayuda a mantener una estructura consistente en las respuestas de la API.

---

# Testing

El testing forma parte del proceso de desarrollo del proyecto y es una de las áreas principales de trabajo del equipo.

Actualmente, el `package.json` todavía no contiene un framework de testing automatizado configurado.

El script disponible es:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

Por lo tanto, **no se debe interpretar este script como una suite de tests funcional**.

El repositorio sí contiene lógica y scripts utilizados durante el proceso de comprobación del backend, como:

```text
scripts/test-logica.js
```

El equipo realiza testing sobre las funcionalidades desarrolladas como parte del proceso de desarrollo y preparación de las distintas Demos.

---

# Multiinstitución

Nexia fue diseñado teniendo en cuenta la posibilidad de trabajar con diferentes instituciones educativas.

El backend cuenta con una entidad específica:

```text
Institucion
```

y con una estructura propia para su gestión:

```text
institucionController.js
institucionService.js
institucionRepository.js
```

La estructura permite organizar los datos institucionales dentro del modelo de Nexia y constituye una base para la evolución de la plataforma hacia un sistema multiinstitución.

---

# Stack tecnológico

| Tecnología              | Uso                                                   |
| ----------------------- | ----------------------------------------------------- |
| **Node.js**             | Entorno de ejecución                                  |
| **JavaScript**          | Lenguaje principal                                    |
| **Express 5.2.1**       | Framework HTTP y servidor de la API                   |
| **PostgreSQL**          | Base de datos relacional                              |
| **pg 8.21.0**           | Conexión con PostgreSQL                               |
| **JWT 9.0.3**           | Autenticación                                         |
| **bcryptjs 3.0.3**      | Hashing de contraseñas                                |
| **Multer 2.2.0**        | Gestión de archivos                                   |
| **CORS 2.8.6**          | Comunicación entre dominios                           |
| **dotenv 17.4.2**       | Variables de entorno                                  |
| **Google GenAI 2.10.0** | Integración con inteligencia artificial               |
| **cross-env 10.1.0**    | Configuración de variables de entorno multiplataforma |

El proyecto utiliza **ES Modules**, indicado mediante:

```json
"type": "module"
```

---

# Instalación y configuración

## Requisitos

Para ejecutar el backend se necesita:

- Node.js.
- npm.
- PostgreSQL.
- Las variables de entorno correspondientes.
- Acceso a los servicios externos utilizados por la aplicación.

La versión exacta de Node.js no está fijada mediante un campo `engines` en el `package.json`, por lo que se recomienda utilizar una versión moderna de Node.js compatible con Express 5 y las dependencias del proyecto.

---

## Instalación

Clonar el repositorio y acceder al directorio del backend:

```bash
git clone <repository-url>
cd Nexia-Back
```

Instalar las dependencias:

```bash
npm install
```

---

## Variables de entorno

Crear un archivo `.env` a partir de:

```text
.env.example
```

y completar las variables necesarias para el entorno local.

No incluir credenciales reales dentro del repositorio.

---

# Ejecución

El archivo principal de la aplicación es:

```text
src/app.js
```

Para iniciar el backend:

```bash
npm run app
```

También existe un script de desarrollo:

```bash
npm run dev
```

Actualmente ambos scripts ejecutan la aplicación mediante Node.js y configuran el certificado utilizado para el entorno del colegio:

```json
"app": "cross-env NODE_EXTRA_CA_CERTS=./certs/fortinet-proxy-ca.pem node ./src/app.js"
```

```json
"dev": "cross-env NODE_EXTRA_CA_CERTS=./certs/fortinet-proxy-ca.pem node ./src/app.js"
```

La dependencia `cross-env` permite establecer la variable de entorno de manera compatible entre diferentes sistemas.

---

## Conexión con la base de datos

El proyecto cuenta con un script específico:

```bash
npm run db
```

que ejecuta:

```text
src/database/db.js
```

La conexión utiliza `pg` y un pool de conexiones hacia PostgreSQL.

---

# Scripts disponibles

Los scripts definidos actualmente en `package.json` son:

| Comando       | Función                                                      |
| ------------- | ------------------------------------------------------------ |
| `npm run app` | Inicia la aplicación                                         |
| `npm run dev` | Inicia la aplicación en el entorno de desarrollo             |
| `npm run db`  | Ejecuta el módulo de conexión/configuración de base de datos |
| `npm test`    | Placeholder de testing actualmente no implementado           |

---

# Metodología de trabajo

Nexia se desarrolló mediante un proceso iterativo acompañado por tutores del colegio.

El equipo realiza reuniones periódicas en las que analiza el estado actual del proyecto y define los objetivos y funcionalidades que se buscarán desarrollar para la siguiente Demo.

El proceso general es:

```text
Análisis
   ↓
Planificación
   ↓
Desarrollo
   ↓
Demo
   ↓
Revisión
   ↓
Mejoras
   ↓
Nuevo ciclo
```

En cada Demo se analiza si los objetivos establecidos fueron alcanzados y qué aspectos pueden mejorarse.

La organización diaria fue flexible. Dependiendo de la complejidad, las tareas podían realizarse individualmente o en duplas.

Cuando fue necesario, determinadas tareas continuaron fuera del horario escolar para cumplir con los objetivos establecidos.

---

# GitHub y colaboración

GitHub se utilizó como repositorio central para almacenar y mantener actualizado el código.

Todos los integrantes participaron activamente en el desarrollo y realizaron commits.

El equipo utiliza Pull Requests para integrar cambios y facilitar la revisión del código.

El flujo general es:

```text
Desarrollo
    ↓
Commit
    ↓
Pull Request
    ↓
Revisión
    ↓
Integración
```

No se utilizó un sistema de branches como parte del flujo habitual de desarrollo.

---

# Uso de inteligencia artificial

La inteligencia artificial fue utilizada como herramienta de apoyo durante el desarrollo.

Las principales herramientas utilizadas fueron:

- **Claude**
- **ChatGPT**
- **Gemini**

Se utilizaron para:

- Investigar tecnologías y conceptos.
- Resolver errores.
- Comprender problemas técnicos.
- Aprender a implementar funcionalidades.
- Generar recursos visuales.
- Investigar alternativas de implementación.
- Agilizar determinadas tareas de desarrollo.

En algunos casos se utilizaron agentes de Claude para asistir directamente en la implementación de determinadas funcionalidades.

La IA fue utilizada como herramienta de asistencia y aprendizaje, mientras que las decisiones relacionadas con el producto, las funcionalidades, la estructura general y la evolución del proyecto fueron tomadas por el equipo.

Debido a la naturaleza colaborativa del desarrollo y al uso de diferentes herramientas, no siempre es posible atribuir de forma precisa cada fragmento de código a una persona o herramienta específica.

---

# Equipo

Nexia fue desarrollado por cinco estudiantes de la especialidad Informática de ORT Argentina.

| Integrante           | Áreas principales                     |
| -------------------- | ------------------------------------- |
| **Uriel Galanti**    | Frontend, diseño y plan de negocio    |
| **Manuel Mandel**    | Backend y frontend                    |
| **Zoe Acquistapace** | Backend, frontend, diseño y seguridad |
| **Felipe Andracca**  | Base de datos, backend y testing      |
| **Matías Naddeo**    | Testing                               |

Estos roles representan las principales áreas de trabajo de cada integrante, pero no fueron responsabilidades exclusivas.

Todo el equipo participó también en:

- Definición de funcionalidades.
- Diseño de la estructura del sistema.
- Generación de ideas.
- Decisiones de producto.
- Análisis de problemas.
- Revisión de funcionalidades.
- Preparación de las Demos.

---

# Estado del proyecto

El backend cuenta con una arquitectura organizada y funcional que soporta los principales dominios de Nexia.

Actualmente contempla:

- Gestión de usuarios.
- Autenticación mediante JWT.
- Autorización basada en roles.
- Instituciones.
- Cursos.
- Materias.
- Contenidos.
- Trabajos prácticos.
- Entregas.
- Calificaciones.
- Boletines.
- Comunicados.
- Eventos.
- Notificaciones.
- Personalización.
- Gestión de archivos.
- Integración con Google GenAI.
- Arquitectura de acceso a datos mediante repositories.

El proyecto continúa en desarrollo y evolución como parte del proyecto final.

---

# Próximos pasos

Algunas de las áreas previstas para continuar evolucionando incluyen:

- Ampliación de funcionalidades académicas.
- Evolución de Nexia IA.
- Mejoras en seguridad.
- Ampliación de las herramientas administrativas.
- Mayor cobertura de testing automatizado.
- Optimización de la infraestructura.
- Evolución del sistema multiinstitución.
- Mejoras en la gestión y almacenamiento de archivos.
- Continuación de la integración entre backend y frontend.

---

# Proyecto Final ORT Argentina

Nexia fue desarrollado como proyecto final por estudiantes de la especialidad Informática de ORT Argentina.

El proyecto integra diferentes áreas:

```text
Backend Development
        +
Frontend Development
        +
Database
        +
UX/UI Design
        +
Testing
        +
Security
        +
Product Strategy
        +
Artificial Intelligence
```

El backend constituye la capa encargada de conectar estas diferentes áreas y proporcionar la infraestructura necesaria para que Nexia funcione como una plataforma educativa integral.

Más allá del desarrollo técnico, Nexia busca explorar cómo el software y la inteligencia artificial pueden utilizarse para centralizar procesos educativos y mejorar la experiencia de alumnos, profesores y administradores.

---

\<p align="center">
&#x20; \<strong>Nexia\</strong>\<br>
&#x20; \<em>Una plataforma para conectar la comunidad educativa.\</em>
\</p>
