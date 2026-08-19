/* Catálogos de datos para el seed del campus. Separado de la lógica para que
   agregar temas, TPs o material de una materia no obligue a tocar el script. */

export const NOMBRES_F = [
  'Martina', 'Valentina', 'Camila', 'Sofía', 'Lucía', 'Emma', 'Catalina', 'Renata',
  'Mía', 'Isabella', 'Julieta', 'Delfina', 'Victoria', 'Guadalupe', 'Pilar',
  'Malena', 'Agustina', 'Josefina', 'Bianca', 'Abril', 'Olivia', 'Antonella',
  'Milagros', 'Jazmín', 'Morena', 'Alma', 'Luz', 'Paloma', 'Emilia', 'Amparo',
  'Constanza', 'Rocío', 'Brenda', 'Ailén', 'Candela', 'Micaela'
];

export const NOMBRES_M = [
  'Benjamín', 'Mateo', 'Bautista', 'Thiago', 'Santino', 'Felipe', 'Joaquín',
  'Lautaro', 'Tomás', 'Valentino', 'Ignacio', 'Santiago', 'Bruno', 'Dante',
  'Gael', 'Franco', 'Lorenzo', 'Máximo', 'Nicolás', 'Emiliano', 'Ciro', 'Simón',
  'Facundo', 'Julián', 'Agustín', 'Matías', 'Ramiro', 'Tobías', 'Salvador',
  'Gonzalo', 'Iván', 'Lucio', 'Álvaro', 'Nahuel', 'Federico', 'Manuel'
];

export const APELLIDOS = [
  'González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Martínez', 'Díaz',
  'Pérez', 'Sánchez', 'Romero', 'Sosa', 'Torres', 'Álvarez', 'Ruiz', 'Ramírez',
  'Flores', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Aguirre', 'Pereyra',
  'Gutiérrez', 'Molina', 'Silva', 'Castro', 'Rojas', 'Ortiz', 'Núñez', 'Luna',
  'Juárez', 'Cabrera', 'Ríos', 'Morales', 'Godoy', 'Moreno', 'Ferrari',
  'Bianchi', 'Ricci', 'Colombo', 'Espósito', 'Greco', 'Rossi', 'Vega',
  'Peralta', 'Quiroga', 'Ibáñez', 'Vera', 'Ledesma', 'Maldonado', 'Villalba',
  'Cardozo', 'Ojeda', 'Arias', 'Figueroa', 'Vázquez', 'Duarte', 'Correa',
  'Bravo', 'Campos', 'Paz', 'Ávila', 'Suárez', 'Miranda', 'Navarro', 'Ponce'
];

export const CIUDADES = [
  'Vicente López', 'San Isidro', 'Olivos', 'Martínez', 'Florida', 'Munro',
  'Villa Ballester', 'San Martín', 'Boulogne', 'Tigre', 'San Fernando',
  'Béccar', 'La Lucila', 'Carapachay', 'Ciudad Autónoma de Buenos Aires'
];

/* Feriados nacionales 2026 que caen dentro del ciclo lectivo, y el receso
   invernal. Se usan para no generar clases esos días. */
export const FERIADOS_2026 = [
  '2026-03-24', // Día de la Memoria
  '2026-04-02', // Malvinas
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Día del Trabajador
  '2026-05-25', // Revolución de Mayo
  '2026-06-15', // Güemes (trasladado)
  '2026-06-20', // Belgrano
  '2026-07-09', // Independencia
  '2026-08-17'  // San Martín
];

export const RECESO_INVERNAL = { desde: '2026-07-20', hasta: '2026-07-31' };

export const CICLO_LECTIVO = { inicio: '2026-03-02', fin: '2026-12-11' };

/* Por materia: temas de clase en orden pedagógico, TPs y material de estudio.
   Los temas se recorren en orden a medida que avanzan las clases del año, así
   el historial de asistencia muestra una progresión creíble. */
export const MATERIAS = {
  'Programación': {
    cargaSemanal: 2,
    temas: [
      'Presentación de la materia y criterios de evaluación',
      'Algoritmos: concepto y representación',
      'Variables y tipos de datos primitivos',
      'Operadores aritméticos y de comparación',
      'Estructuras condicionales: if / else',
      'Condicionales anidados y switch',
      'Ejercitación integradora de condicionales',
      'Bucles: while y do-while',
      'Bucle for y recorridos',
      'Ejercitación con bucles anidados',
      'Arrays: declaración y acceso',
      'Recorrido y búsqueda en arrays',
      'Métodos de arrays: map, filter, reduce',
      'Repaso para la evaluación del primer bimestre',
      'Evaluación escrita — Primer bimestre',
      'Devolución de la evaluación y corrección grupal',
      'Funciones: declaración y parámetros',
      'Ámbito de variables y retorno',
      'Funciones flecha y callbacks',
      'Objetos literales y propiedades',
      'Arrays de objetos',
      'JSON: estructura y parseo',
      'Manipulación del DOM: selección de elementos',
      'Eventos del DOM',
      'Formularios y validación en el cliente',
      'Repaso integrador del segundo bimestre',
      'Evaluación escrita — Segundo bimestre',
      'Presentación del proyecto integrador',
      'Introducción a Git y control de versiones',
      'Trabajo en el proyecto: definición de alcance',
      'Trabajo en el proyecto: maquetado',
      'Trabajo en el proyecto: lógica principal',
      'Consultas y seguimiento del proyecto',
      'Depuración: herramientas del navegador',
      'Buenas prácticas y legibilidad del código',
      'Introducción a la asincronía: promesas',
      'Consumo de APIs con fetch',
      'Manejo de errores con try/catch',
      'Presentaciones parciales del proyecto',
      'Repaso integrador'
    ],
    tps: [
      { titulo: 'TP N°1: Algoritmos y estructuras condicionales', descripcion: 'Resolver los 10 ejercicios de la guía usando condicionales. Entregar un único archivo .js comentado, con el nombre del alumno en la primera línea. Se evalúa el uso correcto de operadores lógicos y la claridad del código.' },
      { titulo: 'TP N°2: Bucles y recorrido de arrays', descripcion: 'Implementar las funciones pedidas en la consigna (búsqueda del máximo, promedio, filtrado de pares y conteo de ocurrencias) sin usar métodos nativos de array. Incluir al menos tres casos de prueba por función.' },
      { titulo: 'TP N°3: Funciones y objetos', descripcion: 'Modelar un sistema de gestión de una biblioteca usando objetos y arrays de objetos. Debe permitir dar de alta un libro, prestarlo, devolverlo y listar los disponibles.' },
      { titulo: 'TP N°4: Proyecto integrador — Aplicación web', descripcion: 'Desarrollar una aplicación web que resuelva un problema real a elección, aplicando lo visto durante el año: manipulación del DOM, eventos, funciones y consumo de una API pública. Entregar el repositorio y un video de 3 minutos mostrando el funcionamiento.' }
    ],
    contenidos: [
      { tipo: 'VIDEO', titulo: 'Curso completo de JavaScript desde cero', url: 'https://www.youtube.com/watch?v=1glVfFxj8a4' },
      { tipo: 'VIDEO', titulo: 'Arrays en JavaScript explicados', url: 'https://www.youtube.com/watch?v=CeOZ02QgH4Y' },
      { tipo: 'LINK', titulo: 'MDN — Guía de JavaScript en español', url: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide' },
      { tipo: 'LINK', titulo: 'freeCodeCamp — Ejercicios de práctica', url: 'https://www.freecodecamp.org/espanol/learn/javascript-algorithms-and-data-structures/' },
      { tipo: 'TEXTO', titulo: 'Apunte: convenciones de estilo y nombres de variables', url: 'https://google.github.io/styleguide/jsguide.html' }
    ]
  },

  'Base de Datos': {
    cargaSemanal: 2,
    temas: [
      'Presentación de la materia. Qué es una base de datos',
      'Modelo relacional: tablas, filas y columnas',
      'Claves primarias y foráneas',
      'Modelo entidad-relación: entidades y atributos',
      'Cardinalidad y tipos de relaciones',
      'Del modelo E-R al modelo relacional',
      'Ejercitación de modelado',
      'Normalización: primera forma normal',
      'Segunda y tercera forma normal',
      'Ejercitación de normalización',
      'SQL: sentencia SELECT y proyección',
      'Filtrado con WHERE y operadores',
      'Ordenamiento con ORDER BY y LIMIT',
      'Repaso para la evaluación del primer bimestre',
      'Evaluación escrita — Primer bimestre',
      'Devolución y corrección de la evaluación',
      'Funciones de agregación: COUNT, SUM, AVG',
      'Agrupamiento con GROUP BY y HAVING',
      'INNER JOIN: combinación de tablas',
      'LEFT JOIN y RIGHT JOIN',
      'Ejercitación integradora de JOINs',
      'Subconsultas en WHERE y FROM',
      'INSERT, UPDATE y DELETE',
      'Integridad referencial y restricciones',
      'Transacciones: COMMIT y ROLLBACK',
      'Repaso integrador del segundo bimestre',
      'Evaluación escrita — Segundo bimestre',
      'Índices: para qué sirven y cuándo usarlos',
      'Vistas y consultas reutilizables',
      'Diseño de una base para un caso real',
      'Trabajo en el proyecto: modelo de datos',
      'Trabajo en el proyecto: carga y consultas',
      'Seguridad: usuarios y permisos',
      'Inyección SQL y consultas parametrizadas',
      'Backups y restauración',
      'Introducción a las bases NoSQL',
      'Comparación entre modelos relacional y documental',
      'Presentaciones del proyecto',
      'Repaso integrador'
    ],
    tps: [
      { titulo: 'TP N°1: Modelo entidad-relación', descripcion: 'A partir del enunciado de la veterinaria entregado en clase, construir el diagrama entidad-relación completo indicando entidades, atributos, claves y cardinalidades. Entregar el diagrama en PDF.' },
      { titulo: 'TP N°2: Consultas SELECT y filtrado', descripcion: 'Resolver las 20 consultas planteadas sobre la base de datos "escuela". Entregar un archivo .sql con las consultas numeradas y comentadas.' },
      { titulo: 'TP N°3: JOINs y agregaciones', descripcion: 'Resolver las consultas del anexo combinando al menos dos tablas y usando funciones de agregación. Justificar en un comentario por qué se eligió cada tipo de JOIN.' },
      { titulo: 'TP N°4: Diseño e implementación de una base completa', descripcion: 'Diseñar, crear y poblar una base de datos para el caso asignado a cada grupo. Entregar el script SQL de creación, el de carga y 10 consultas de ejemplo con su resultado.' }
    ],
    contenidos: [
      { tipo: 'VIDEO', titulo: 'Curso de SQL y bases de datos desde cero', url: 'https://www.youtube.com/watch?v=OuJerKzV5T0' },
      { tipo: 'VIDEO', titulo: 'INNER JOIN explicado con práctica', url: 'https://www.youtube.com/watch?v=0BstRqp6Svg' },
      { tipo: 'VIDEO', titulo: 'LEFT JOIN y RIGHT JOIN', url: 'https://www.youtube.com/watch?v=nw6tK0E5iyo' },
      { tipo: 'LINK', titulo: 'PostgreSQL — Documentación oficial en español', url: 'https://www.postgresql.org/docs/current/tutorial.html' },
      { tipo: 'LINK', titulo: 'SQLBolt — Ejercicios interactivos de SQL', url: 'https://sqlbolt.com/' }
    ]
  },

  'Matemática': {
    cargaSemanal: 2,
    temas: [
      'Presentación de la materia y diagnóstico inicial',
      'Conjuntos numéricos: naturales, enteros y racionales',
      'Números reales y recta numérica',
      'Operaciones con expresiones algebraicas',
      'Ecuaciones de primer grado',
      'Problemas de aplicación con ecuaciones',
      'Sistemas de ecuaciones: método de sustitución',
      'Sistemas de ecuaciones: método de igualación y gráfico',
      'Ejercitación integradora de sistemas',
      'Inecuaciones de primer grado',
      'Función lineal: pendiente y ordenada al origen',
      'Gráfico de funciones lineales',
      'Rectas paralelas y perpendiculares',
      'Repaso para la evaluación del primer bimestre',
      'Evaluación escrita — Primer bimestre',
      'Devolución y corrección de la evaluación',
      'Función cuadrática: forma polinómica',
      'Raíces y discriminante',
      'Vértice y eje de simetría',
      'Gráfico de la parábola',
      'Problemas de optimización con cuadráticas',
      'Ecuaciones de segundo grado: fórmula resolvente',
      'Factorización de polinomios',
      'Operaciones con polinomios',
      'Teorema del resto y regla de Ruffini',
      'Repaso integrador del segundo bimestre',
      'Evaluación escrita — Segundo bimestre',
      'Trigonometría: razones en el triángulo rectángulo',
      'Resolución de triángulos rectángulos',
      'Teorema del seno',
      'Teorema del coseno',
      'Problemas de aplicación de trigonometría',
      'Función exponencial',
      'Logaritmos: definición y propiedades',
      'Ecuaciones exponenciales y logarítmicas',
      'Estadística: medidas de tendencia central',
      'Estadística: dispersión y gráficos',
      'Probabilidad: casos favorables y posibles',
      'Repaso integrador'
    ],
    tps: [
      { titulo: 'TP N°1: Ecuaciones y sistemas de primer grado', descripcion: 'Resolver los ejercicios 1 al 15 de la guía. Se debe entregar en papel, con todos los pasos desarrollados y el resultado final recuadrado. Los ejercicios sin desarrollo no se consideran resueltos.' },
      { titulo: 'TP N°2: Función lineal y cuadrática', descripcion: 'Graficar las funciones del punto A y B indicando dominio, imagen, raíces, ordenada al origen y vértice cuando corresponda. Usar papel milimetrado o GeoGebra.' },
      { titulo: 'TP N°3: Polinomios y factorización', descripcion: 'Factorizar los polinomios propuestos aplicando el método más conveniente en cada caso y justificar la elección. Verificar los resultados con el teorema del resto.' },
      { titulo: 'TP N°4: Trigonometría aplicada', descripcion: 'Resolver los problemas de altura y distancia planteados en la guía usando teorema del seno y del coseno. Cada problema debe incluir el esquema del triángulo con los datos volcados.' }
    ],
    contenidos: [
      { tipo: 'VIDEO', titulo: 'Ecuaciones de primer grado — Ejercicios resueltos', url: 'https://www.youtube.com/watch?v=qeKEA066OSs' },
      { tipo: 'VIDEO', titulo: 'Ecuación de la recta a partir de la pendiente', url: 'https://www.youtube.com/watch?v=yWAAzjLkJYo' },
      { tipo: 'VIDEO', titulo: 'Funciones lineales — Problema de aplicación', url: 'https://www.youtube.com/watch?v=9rznKsHQIrA' },
      { tipo: 'LINK', titulo: 'GeoGebra — Calculadora gráfica online', url: 'https://www.geogebra.org/graphing' },
      { tipo: 'LINK', titulo: 'Khan Academy — Álgebra en español', url: 'https://es.khanacademy.org/math/algebra' }
    ]
  },

  'Física': {
    cargaSemanal: 1,
    temas: [
      'Presentación de la materia. Magnitudes y unidades',
      'Sistema Internacional y notación científica',
      'Cifras significativas y error de medición',
      'Vectores: representación y componentes',
      'Suma y resta de vectores',
      'Cinemática: posición, desplazamiento y trayectoria',
      'Movimiento rectilíneo uniforme (MRU)',
      'Gráficos de posición y velocidad en MRU',
      'Movimiento rectilíneo uniformemente variado (MRUV)',
      'Caída libre y tiro vertical',
      'Repaso para la evaluación del primer bimestre',
      'Evaluación escrita — Primer bimestre',
      'Devolución y corrección de la evaluación',
      'Tiro oblicuo',
      'Leyes de Newton: primera ley',
      'Segunda y tercera ley de Newton',
      'Diagramas de cuerpo libre',
      'Fuerza de rozamiento',
      'Trabajo y potencia',
      'Energía cinética y potencial',
      'Conservación de la energía mecánica',
      'Repaso integrador del segundo bimestre',
      'Evaluación escrita — Segundo bimestre',
      'Cantidad de movimiento e impulso',
      'Choques elásticos e inelásticos',
      'Estática: equilibrio de cuerpos',
      'Hidrostática: presión y principio de Pascal',
      'Principio de Arquímedes',
      'Temperatura y dilatación',
      'Calor y cambios de estado',
      'Repaso integrador'
    ],
    tps: [
      { titulo: 'TP N°1: Cinemática — MRU y MRUV', descripcion: 'Resolver los 12 problemas de la guía. Cada uno debe incluir el esquema de la situación, los datos, la fórmula utilizada y el resultado con su unidad correspondiente.' },
      { titulo: 'TP N°2: Laboratorio de caída libre', descripcion: 'Informe del laboratorio realizado en clase: objetivo, materiales, procedimiento, tabla de mediciones, cálculo de la gravedad experimental y comparación con el valor teórico. Máximo 4 carillas.' },
      { titulo: 'TP N°3: Leyes de Newton y diagramas de cuerpo libre', descripcion: 'Para cada una de las situaciones planteadas, dibujar el diagrama de cuerpo libre, plantear las ecuaciones de Newton y despejar la incógnita pedida.' },
      { titulo: 'TP N°4: Trabajo, energía y su conservación', descripcion: 'Resolver los problemas aplicando el principio de conservación de la energía mecánica. Indicar en cada caso qué tipo de energía se transforma y si hay pérdidas por rozamiento.' }
    ],
    contenidos: [
      { tipo: 'VIDEO', titulo: 'MRUV explicado con ejercicios', url: 'https://www.youtube.com/watch?v=RmVNjJ9Nk_o' },
      { tipo: 'LINK', titulo: 'PhET — Simulaciones interactivas de física', url: 'https://phet.colorado.edu/es/simulations/filter?subjects=physics' },
      { tipo: 'LINK', titulo: 'Educaplus — Simuladores de cinemática', url: 'https://www.educaplus.org/game/movimiento-rectilineo-uniforme' },
      { tipo: 'TEXTO', titulo: 'Formulario de cinemática y dinámica', url: 'https://es.wikipedia.org/wiki/Cinem%C3%A1tica' }
    ]
  },

  'Química': {
    cargaSemanal: 1,
    temas: [
      'Presentación de la materia. La química como ciencia',
      'Materia: propiedades y estados de agregación',
      'Sustancias puras y mezclas',
      'Métodos de separación de mezclas',
      'Modelos atómicos: de Dalton a Bohr',
      'Estructura del átomo: partículas subatómicas',
      'Número atómico, másico e isótopos',
      'Configuración electrónica',
      'Tabla periódica: organización y grupos',
      'Propiedades periódicas',
      'Repaso para la evaluación del primer bimestre',
      'Evaluación escrita — Primer bimestre',
      'Devolución y corrección de la evaluación',
      'Enlace iónico',
      'Enlace covalente y estructuras de Lewis',
      'Enlace metálico y propiedades',
      'Nomenclatura de compuestos inorgánicos',
      'Óxidos, hidróxidos y ácidos',
      'Sales: formación y nomenclatura',
      'Reacciones químicas y su clasificación',
      'Balanceo de ecuaciones',
      'Repaso integrador del segundo bimestre',
      'Evaluación escrita — Segundo bimestre',
      'Mol y número de Avogadro',
      'Masa molar y cálculos estequiométricos',
      'Estequiometría: reactivo limitante',
      'Soluciones: concentración porcentual',
      'Molaridad y preparación de soluciones',
      'Ácidos y bases: escala de pH',
      'Reacciones de neutralización',
      'Repaso integrador'
    ],
    tps: [
      { titulo: 'TP N°1: Estructura atómica y tabla periódica', descripcion: 'Completar la tabla del anexo con configuración electrónica, grupo, período y propiedades de los 15 elementos asignados. Justificar la ubicación de tres de ellos.' },
      { titulo: 'TP N°2: Laboratorio de separación de mezclas', descripcion: 'Informe del laboratorio: describir los métodos aplicados (filtración, decantación y evaporación), incluir esquema del armado y explicar en qué propiedad se basa cada separación.' },
      { titulo: 'TP N°3: Enlaces químicos y nomenclatura', descripcion: 'Determinar el tipo de enlace de los compuestos listados, representar las estructuras de Lewis correspondientes y nombrarlos según la nomenclatura IUPAC.' },
      { titulo: 'TP N°4: Estequiometría y soluciones', descripcion: 'Resolver los problemas de cálculo estequiométrico y de preparación de soluciones. Incluir el planteo del factor de conversión en cada caso.' }
    ],
    contenidos: [
      { tipo: 'VIDEO', titulo: 'Configuración electrónica paso a paso', url: 'https://www.youtube.com/watch?v=8CJ0TT9Ntt8' },
      { tipo: 'LINK', titulo: 'Tabla periódica interactiva (Ptable)', url: 'https://ptable.com/?lang=es' },
      { tipo: 'LINK', titulo: 'PhET — Simulaciones de química', url: 'https://phet.colorado.edu/es/simulations/filter?subjects=chemistry' },
      { tipo: 'TEXTO', titulo: 'Guía de nomenclatura inorgánica IUPAC', url: 'https://es.wikipedia.org/wiki/Nomenclatura_qu%C3%ADmica_de_los_compuestos_inorg%C3%A1nicos' }
    ]
  },

  'Historia': {
    cargaSemanal: 1,
    temas: [
      'Presentación de la materia. Qué estudia la historia',
      'Fuentes históricas: primarias y secundarias',
      'La crisis del orden colonial en América',
      'La Revolución de Mayo de 1810',
      'Las guerras de independencia',
      'El Congreso de Tucumán y la declaración de 1816',
      'Unitarios y federales: el conflicto por la organización',
      'La época de Rosas',
      'Repaso para la evaluación del primer bimestre',
      'Evaluación escrita — Primer bimestre',
      'Devolución y corrección de la evaluación',
      'La Constitución de 1853',
      'La organización nacional y la presidencia de Mitre',
      'El modelo agroexportador',
      'La inmigración masiva y la sociedad aluvial',
      'La Generación del 80',
      'La Ley Sáenz Peña y el radicalismo',
      'La Primera Guerra Mundial y su impacto en Argentina',
      'Repaso integrador del segundo bimestre',
      'Evaluación escrita — Segundo bimestre',
      'La crisis de 1930 y el golpe militar',
      'La década infame',
      'El surgimiento del peronismo',
      'El primer y segundo gobierno de Perón',
      'La Revolución Libertadora y la proscripción',
      'Los gobiernos civiles y militares (1955-1966)',
      'El Cordobazo y la movilización social',
      'La última dictadura militar',
      'El terrorismo de Estado y los derechos humanos',
      'El retorno de la democracia en 1983',
      'Repaso integrador'
    ],
    tps: [
      { titulo: 'TP N°1: Análisis de fuentes de la Revolución de Mayo', descripcion: 'Leer los tres documentos del cuadernillo y responder la guía de análisis: contexto de producción, intencionalidad del autor, destinatario y qué visión de los hechos transmite cada uno.' },
      { titulo: 'TP N°2: Unitarios y federales — Cuadro comparativo', descripcion: 'Elaborar un cuadro comparativo entre ambos proyectos políticos considerando: base social, propuesta económica, organización del territorio y referentes. Cerrar con una conclusión propia de 15 líneas.' },
      { titulo: 'TP N°3: La inmigración y la sociedad aluvial', descripcion: 'Investigar la historia migratoria de la propia familia o de una familia del barrio y relacionarla con el proceso inmigratorio estudiado. Entregar en formato de relato histórico con al menos dos fuentes citadas.' },
      { titulo: 'TP N°4: Memoria, verdad y justicia', descripcion: 'Trabajo grupal de investigación sobre un aspecto de la última dictadura militar. Debe incluir marco temporal, actores involucrados, testimonios y una reflexión final sobre la importancia de la memoria.' }
    ],
    contenidos: [
      { tipo: 'LINK', titulo: 'Educ.ar — Recursos de Historia Argentina', url: 'https://www.educ.ar/recursos/buscar?tema=historia' },
      { tipo: 'LINK', titulo: 'Archivo Histórico — Documentos de Mayo de 1810', url: 'https://www.argentina.gob.ar/interior/archivo-general-de-la-nacion' },
      { tipo: 'VIDEO', titulo: 'Canal Encuentro — Historia de un país', url: 'https://www.youtube.com/watch?v=oIwFAOFgUvQ' },
      { tipo: 'TEXTO', titulo: 'Cronología de la historia argentina 1810-1983', url: 'https://es.wikipedia.org/wiki/Historia_de_la_Argentina' }
    ]
  },

  'Literatura': {
    cargaSemanal: 1,
    temas: [
      'Presentación de la materia y contrato de lectura',
      'El texto literario: ficción y verosimilitud',
      'Géneros literarios: narrativo, lírico y dramático',
      'El cuento: estructura y elementos',
      'El narrador y los puntos de vista',
      'Lectura y análisis: "Casa tomada" de Julio Cortázar',
      'Lo fantástico en la literatura rioplatense',
      'Lectura y análisis: "El Aleph" de Jorge Luis Borges',
      'Repaso para la evaluación del primer bimestre',
      'Evaluación escrita — Primer bimestre',
      'Devolución y corrección de la evaluación',
      'La novela: características del género',
      'Lectura de la novela del bimestre — primera parte',
      'Lectura de la novela del bimestre — segunda parte',
      'Personajes: construcción y evolución',
      'Tiempo y espacio en la narración',
      'El realismo mágico latinoamericano',
      'Gabriel García Márquez y el boom',
      'Repaso integrador del segundo bimestre',
      'Evaluación escrita — Segundo bimestre',
      'La poesía: verso, ritmo y métrica',
      'Recursos poéticos: metáfora e imagen',
      'Poesía argentina contemporánea',
      'Alejandra Pizarnik: lectura y análisis',
      'El teatro: texto dramático y puesta en escena',
      'Lectura dramatizada en clase',
      'El grotesco criollo',
      'Taller de escritura creativa',
      'Presentación de producciones propias',
      'Repaso integrador'
    ],
    tps: [
      { titulo: 'TP N°1: Análisis de texto narrativo', descripcion: 'Leer el cuento "Casa tomada" de Julio Cortázar y responder la guía de análisis: tipo de narrador, construcción del espacio, elementos de lo fantástico y posibles interpretaciones del final. Mínimo dos carillas.' },
      { titulo: 'TP N°2: Producción de un cuento fantástico', descripcion: 'Escribir un cuento propio de entre 800 y 1200 palabras que incorpore al menos dos recursos de lo fantástico trabajados en clase. Se evalúa originalidad, coherencia interna y corrección en la escritura.' },
      { titulo: 'TP N°3: Informe de lectura de la novela', descripcion: 'Elaborar un informe de lectura de la novela asignada que incluya: síntesis argumental, análisis de dos personajes principales, tratamiento del tiempo y una valoración personal fundamentada.' },
      { titulo: 'TP N°4: Antología poética comentada', descripcion: 'Seleccionar cinco poemas de autores latinoamericanos, armar una antología con un criterio propio y justificar la selección. Cada poema debe ir acompañado de un breve comentario de análisis.' }
    ],
    contenidos: [
      { tipo: 'TEXTO', titulo: '"Casa tomada" — Julio Cortázar (texto completo)', url: 'https://www.literatura.us/cortazar/casa.html' },
      { tipo: 'TEXTO', titulo: '"El Aleph" — Jorge Luis Borges', url: 'https://www.literatura.us/borges/elaleph.html' },
      { tipo: 'LINK', titulo: 'Biblioteca Nacional — Literatura argentina', url: 'https://www.bn.gov.ar/' },
      { tipo: 'VIDEO', titulo: 'Cortázar lee "Casa tomada"', url: 'https://www.youtube.com/watch?v=Xf_S6BhCQ2A' }
    ]
  },

  'Inglés': {
    cargaSemanal: 2,
    temas: [
      'Course presentation and diagnostic test',
      'Review: present simple and present continuous',
      'Daily routines and frequency adverbs',
      'Past simple: regular and irregular verbs',
      'Past continuous and narrative tenses',
      'Telling a story: connectors and sequence',
      'Reading comprehension: short stories',
      'Vocabulary: describing people and places',
      'Review for the first term test',
      'First term written test',
      'Test feedback and correction',
      'Present perfect: for and since',
      'Present perfect vs past simple',
      'Experiences and life events',
      'Future forms: will, going to, present continuous',
      'Making predictions and plans',
      'Listening comprehension practice',
      'Review for the second term test',
      'Second term written test',
      'Conditionals: zero and first',
      'Second conditional and hypothetical situations',
      'Modal verbs: ability, obligation and advice',
      'Passive voice: present and past',
      'Reported speech: statements',
      'Reported speech: questions and commands',
      'Job interviews and formal register',
      'Writing a formal email',
      'Oral presentations',
      'Final review'
    ],
    tps: [
      { titulo: 'TP N°1: Past tenses — Narrative writing', descripcion: 'Write a 250-word narrative about a memorable experience using past simple and past continuous. Pay attention to time connectors and paragraph organisation. Handwritten submissions are not accepted.' },
      { titulo: 'TP N°2: Reading comprehension and vocabulary', descripcion: 'Read the assigned article and complete the comprehension tasks: true/false with justification, vocabulary matching and a 100-word summary in your own words.' },
      { titulo: 'TP N°3: Conditionals and modal verbs', descripcion: 'Complete the grammar exercises from the booklet and write eight original sentences using the structures practised in class. Each sentence must refer to a real situation from your own life.' },
      { titulo: 'TP N°4: Oral presentation — A topic you care about', descripcion: 'Prepare a 5-minute oral presentation on a topic of your choice. Submit the script and the slides one week before the presentation date. Fluency, pronunciation and use of the target language will be assessed.' }
    ],
    contenidos: [
      { tipo: 'LINK', titulo: 'British Council — LearnEnglish Teens', url: 'https://learnenglishteens.britishcouncil.org/' },
      { tipo: 'LINK', titulo: 'Cambridge Dictionary — English-Spanish', url: 'https://dictionary.cambridge.org/es/diccionario/ingles-espanol/' },
      { tipo: 'VIDEO', titulo: 'Present Perfect vs Past Simple explained', url: 'https://www.youtube.com/watch?v=xTBSGE8YtqM' },
      { tipo: 'LINK', titulo: 'Perfect English Grammar — Exercises', url: 'https://www.perfect-english-grammar.com/grammar-exercises.html' }
    ]
  },

  'Comunicación': {
    cargaSemanal: 1,
    temas: [
      'Presentación de la materia. Qué es comunicar',
      'Elementos del circuito comunicativo',
      'Funciones del lenguaje',
      'Tipos textuales: narrativo, expositivo y argumentativo',
      'El texto expositivo: estructura y recursos',
      'Resumen y síntesis de información',
      'El texto argumentativo: tesis y argumentos',
      'Falacias argumentativas',
      'Repaso para la evaluación del primer bimestre',
      'Evaluación escrita — Primer bimestre',
      'Devolución y corrección de la evaluación',
      'Los medios masivos de comunicación',
      'La noticia: estructura y pirámide invertida',
      'Objetividad y subjetividad en la información',
      'Análisis comparativo de coberturas periodísticas',
      'La opinión: editorial y columna',
      'Publicidad y propaganda',
      'Repaso integrador del segundo bimestre',
      'Evaluación escrita — Segundo bimestre',
      'Redes sociales y nuevas formas de comunicación',
      'Desinformación y noticias falsas',
      'Verificación de fuentes',
      'Comunicación institucional',
      'Oratoria: preparación de una exposición oral',
      'Recursos paraverbales y no verbales',
      'Taller de producción audiovisual',
      'Presentación de producciones',
      'Repaso integrador'
    ],
    tps: [
      { titulo: 'TP N°1: Análisis del circuito comunicativo', descripcion: 'Seleccionar tres situaciones comunicativas de la vida cotidiana e identificar en cada una los elementos del circuito, la función del lenguaje predominante y el tipo de código utilizado.' },
      { titulo: 'TP N°2: Producción de una nota periodística', descripcion: 'Escribir una nota informativa sobre un hecho ocurrido en la escuela o el barrio respetando la estructura de pirámide invertida. Debe incluir título, copete, cuerpo y al menos una fuente consultada.' },
      { titulo: 'TP N°3: Análisis comparativo de coberturas', descripcion: 'Elegir una misma noticia publicada por tres medios distintos y comparar el tratamiento: titulación, selección de fuentes, adjetivación y qué se omite en cada caso. Concluir sobre la construcción del enfoque.' },
      { titulo: 'TP N°4: Campaña de comunicación', descripcion: 'En grupos, diseñar una campaña de concientización sobre una problemática de la comunidad escolar. Entregar el fundamento, la definición del público destinatario, las piezas producidas y el plan de difusión.' }
    ],
    contenidos: [
      { tipo: 'LINK', titulo: 'Chequeado — Verificación de información', url: 'https://chequeado.com/' },
      { tipo: 'LINK', titulo: 'Educ.ar — Medios y comunicación', url: 'https://www.educ.ar/recursos/buscar?tema=comunicacion' },
      { tipo: 'VIDEO', titulo: 'Cómo se construye una noticia', url: 'https://www.youtube.com/watch?v=0Wl-tGnQ9Zc' },
      { tipo: 'TEXTO', titulo: 'Apunte: funciones del lenguaje según Jakobson', url: 'https://es.wikipedia.org/wiki/Funciones_del_lenguaje' }
    ]
  }
};

/* Comunicados institucionales a lo largo del ciclo lectivo 2026. */
export const COMUNICADOS = [
  { fecha: '2026-03-02', titulo: 'Inicio del ciclo lectivo 2026', contenido: 'Damos la bienvenida a toda la comunidad educativa al ciclo lectivo 2026. Las clases comienzan el lunes 2 de marzo en el horario habitual. Recordamos que la primera semana funciona con horario reducido hasta las 13:00 hs y que a partir del lunes 9 se retoma el horario completo. Los alumnos deben presentarse con el uniforme reglamentario y la libreta de comunicaciones firmada.', activo: true },
  { fecha: '2026-03-06', titulo: 'Entrega de horarios y listado de materiales', contenido: 'Ya se encuentran disponibles en el campus los horarios definitivos de cada curso y el listado de materiales por materia. Solicitamos a las familias revisarlos junto a los estudiantes durante el fin de semana. Cualquier inconveniente con la carga horaria debe informarse a preceptoría antes del viernes 13 de marzo.', activo: true },
  { fecha: '2026-03-20', titulo: 'Acto por el Día de la Memoria', contenido: 'El día lunes 23 de marzo se realizará el acto conmemorativo por el Día Nacional de la Memoria por la Verdad y la Justicia en el patio central a las 10:00 hs. La asistencia es obligatoria para todos los cursos. El martes 24 no habrá actividad académica por ser feriado nacional.', activo: true },
  { fecha: '2026-04-10', titulo: 'Reunión de padres — Primer bimestre', contenido: 'Se convoca a padres, madres y tutores a la reunión informativa del primer bimestre, que se realizará el jueves 16 de abril a las 18:30 hs en el salón de actos. Se informará el estado académico general de cada curso y se presentará al equipo docente. En caso de no poder asistir, solicitamos avisar a preceptoría.', activo: true },
  { fecha: '2026-04-24', titulo: 'Campaña de vacunación 2026', contenido: 'Se recuerda a las familias que deben presentar el carnet de vacunación actualizado antes del 15 de mayo. El personal de salud del centro asistencial de la zona concurrirá a la institución el miércoles 6 de mayo para completar las dosis faltantes de quienes hayan presentado la autorización firmada.', activo: true },
  { fecha: '2026-05-04', titulo: 'Cierre del primer bimestre y entrega de boletines', contenido: 'El primer bimestre cierra el 30 de abril. Las calificaciones estarán disponibles en el campus a partir del lunes 11 de mayo. Los boletines impresos se entregarán en mano durante la semana del 18 de mayo. Los estudiantes con materias desaprobadas serán citados junto a sus familias por el equipo de coordinación.', activo: true },
  { fecha: '2026-05-20', titulo: 'Jornada de puertas abiertas', contenido: 'Invitamos a toda la comunidad a la jornada de puertas abiertas del sábado 30 de mayo de 10:00 a 14:00 hs. Los estudiantes de las especialidades de Informática y Humanidades presentarán sus proyectos y habrá visitas guiadas por los laboratorios y talleres. Entrada libre y gratuita.', activo: true },
  { fecha: '2026-06-12', titulo: 'Olimpíadas de Matemática — Instancia escolar', contenido: 'El viernes 26 de junio se realizará la instancia escolar de las Olimpíadas de Matemática. Los interesados deben inscribirse en preceptoría antes del 19 de junio. La participación es voluntaria y quienes clasifiquen representarán a la institución en la instancia regional de agosto.', activo: true },
  { fecha: '2026-07-03', titulo: 'Cierre del segundo bimestre y receso invernal', contenido: 'El segundo bimestre cierra el 30 de junio. Las calificaciones se publicarán en el campus el viernes 10 de julio. El receso invernal se extiende del lunes 20 al viernes 31 de julio inclusive. Las clases se retoman el lunes 3 de agosto en el horario habitual.', activo: true },
  { fecha: '2026-08-03', titulo: 'Reinicio de clases — Segundo semestre', contenido: 'Retomamos la actividad académica este lunes 3 de agosto con el horario completo habitual. Recordamos que el tercer bimestre se extiende hasta el 30 de septiembre y que las instancias de recuperación de las materias adeudadas del primer semestre se comunicarán por curso durante la primera semana.', activo: true },
  { fecha: '2026-08-10', titulo: 'Mesas de recuperación — Primer semestre', contenido: 'Los estudiantes que adeuden materias del primer o segundo bimestre deberán presentarse a las mesas de recuperación según el cronograma publicado en cartelera y en el campus. Es requisito haber entregado previamente los trabajos prácticos pendientes. Ante dudas, consultar con el docente de la materia.', activo: true },
  { fecha: '2026-08-14', titulo: 'Acto por el paso a la inmortalidad del Gral. San Martín', contenido: 'El viernes 14 de agosto se realizará el acto conmemorativo en homenaje al General José de San Martín, patrono de nuestra institución, a las 9:30 hs en el patio central. Participarán los cursos de 5° año con una presentación preparada en la materia Historia. El lunes 17 no habrá clases por feriado nacional.', activo: true },
  { fecha: '2026-08-18', titulo: 'Habilitación del módulo de asistencias en el campus', contenido: 'A partir de esta semana los docentes registran la asistencia de cada clase directamente en el campus virtual. Las familias y los estudiantes pueden consultar el detalle de inasistencias y el porcentaje de asistencia por materia desde su perfil. Ante cualquier diferencia con el registro, comunicarse con preceptoría dentro de las 48 horas.', activo: true }
];

/* Eventos del calendario institucional 2026. */
export const EVENTOS = [
  { fecha: '2026-03-02', titulo: 'Inicio del ciclo lectivo', tipo: 'evento', descripcion: 'Comienzo de clases con horario reducido hasta el viernes 6 de marzo.' },
  { fecha: '2026-03-23', titulo: 'Acto — Día de la Memoria', tipo: 'evento', descripcion: 'Acto conmemorativo en el patio central. Asistencia obligatoria.' },
  { fecha: '2026-03-24', titulo: 'Feriado — Día de la Memoria', tipo: 'feriado', descripcion: 'Día Nacional de la Memoria por la Verdad y la Justicia. No hay actividad.' },
  { fecha: '2026-04-02', titulo: 'Feriado — Día del Veterano y de los Caídos en Malvinas', tipo: 'feriado', descripcion: 'No hay actividad académica.' },
  { fecha: '2026-04-03', titulo: 'Feriado — Viernes Santo', tipo: 'feriado', descripcion: 'No hay actividad académica.' },
  { fecha: '2026-04-16', titulo: 'Reunión de padres — Primer bimestre', tipo: 'reunion', descripcion: 'Salón de actos, 18:30 hs.' },
  { fecha: '2026-04-30', titulo: 'Cierre del primer bimestre', tipo: 'academico', descripcion: 'Último día para la carga de calificaciones del primer bimestre.' },
  { fecha: '2026-05-01', titulo: 'Feriado — Día del Trabajador', tipo: 'feriado', descripcion: 'No hay actividad académica.' },
  { fecha: '2026-05-06', titulo: 'Campaña de vacunación', tipo: 'evento', descripcion: 'Concurre personal de salud a la institución. Traer autorización firmada.' },
  { fecha: '2026-05-25', titulo: 'Feriado — Revolución de Mayo', tipo: 'feriado', descripcion: 'No hay actividad académica.' },
  { fecha: '2026-05-30', titulo: 'Jornada de puertas abiertas', tipo: 'evento', descripcion: 'De 10:00 a 14:00 hs. Presentación de proyectos de las especialidades.' },
  { fecha: '2026-06-15', titulo: 'Feriado — Paso a la inmortalidad del Gral. Güemes', tipo: 'feriado', descripcion: 'No hay actividad académica.' },
  { fecha: '2026-06-20', titulo: 'Feriado — Día de la Bandera', tipo: 'feriado', descripcion: 'No hay actividad académica.' },
  { fecha: '2026-06-26', titulo: 'Olimpíadas de Matemática — Instancia escolar', tipo: 'academico', descripcion: 'Participación voluntaria con inscripción previa en preceptoría.' },
  { fecha: '2026-06-30', titulo: 'Cierre del segundo bimestre', tipo: 'academico', descripcion: 'Último día para la carga de calificaciones del segundo bimestre.' },
  { fecha: '2026-07-09', titulo: 'Feriado — Día de la Independencia', tipo: 'feriado', descripcion: 'No hay actividad académica.' },
  { fecha: '2026-07-20', titulo: 'Inicio del receso invernal', tipo: 'receso', descripcion: 'El receso se extiende hasta el viernes 31 de julio inclusive.' },
  { fecha: '2026-08-03', titulo: 'Reinicio de clases', tipo: 'academico', descripcion: 'Comienzo del tercer bimestre con horario completo.' },
  { fecha: '2026-08-14', titulo: 'Acto — Paso a la inmortalidad del Gral. San Martín', tipo: 'evento', descripcion: 'Patio central, 9:30 hs. Presentación a cargo de 5° año.' },
  { fecha: '2026-08-17', titulo: 'Feriado — Paso a la inmortalidad del Gral. San Martín', tipo: 'feriado', descripcion: 'No hay actividad académica.' },
  { fecha: '2026-09-21', titulo: 'Día del Estudiante', tipo: 'evento', descripcion: 'Jornada recreativa. Actividades organizadas por el centro de estudiantes.' },
  { fecha: '2026-09-30', titulo: 'Cierre del tercer bimestre', tipo: 'academico', descripcion: 'Último día para la carga de calificaciones del tercer bimestre.' },
  { fecha: '2026-11-30', titulo: 'Cierre del cuarto bimestre', tipo: 'academico', descripcion: 'Último día para la carga de calificaciones del cuarto bimestre.' },
  { fecha: '2026-12-11', titulo: 'Fin del ciclo lectivo', tipo: 'academico', descripcion: 'Último día de clases. Acto de cierre y entrega de diplomas de 5° año.' }
];
