import pool from '../database/db.js';

export default class CursoRepository {
  getAllAsync = async (institucionId = null) => {
    const values = [];
    let filtro = '';

    if (institucionId) {
      values.push(institucionId);
      filtro = 'WHERE c.institucion_id = $1';
    }

    // Los contadores salen de subconsultas y no de JOINs: con JOIN + GROUP BY,
    // un curso con 3 materias y 20 alumnos produce 60 filas y los COUNT se
    // multiplican entre sí. El gestor vería "60 alumnos" en un curso de 20.
    const result = await pool.query(`
      SELECT
        c.id AS curso_id,
        c.institucion_id,
        c.anio,
        c.division,
        e.id AS especialidad_id,
        e.nombre AS especialidad_nombre,
        (SELECT COUNT(*)::int FROM alumno a WHERE a.curso_id = c.id) AS cantidad_alumnos,
        (SELECT COUNT(*)::int FROM curso_materia cm WHERE cm.curso_id = c.id) AS cantidad_materias
      FROM curso c
      LEFT JOIN especialidad e ON e.id = c.especialidad_id
      ${filtro}
      ORDER BY c.anio, c.division
    `, values);

    return result.rows;
  };

  getByIdAsync = async (id) => {
    const result = await pool.query(`
      SELECT
        c.id AS curso_id,
        c.institucion_id,
        c.anio,
        c.division,
        e.id AS especialidad_id,
        e.nombre AS especialidad_nombre
      FROM curso c
      LEFT JOIN especialidad e ON e.id = c.especialidad_id
      WHERE c.id = $1
    `, [id]);

    return result.rows[0] ?? null;
  };

  /**
   * ¿Ya existe ese año + división en la institución?
   *
   * `excluirId` es para la edición: al guardar un curso sin cambiarle el
   * nombre, el propio registro daría falso positivo y el update se
   * rechazaría a sí mismo.
   *
   * La división se compara sin distinguir mayúsculas ni espacios sobrantes,
   * porque "1° A" y "1° a" son el mismo curso para cualquier institución.
   */
  existeAnioDivisionAsync = async (institucionId, anio, division, excluirId = null) => {
    const values = [institucionId, anio, String(division).trim()];
    let filtro = '';

    if (excluirId) {
      values.push(excluirId);
      filtro = 'AND id <> $4';
    }

    const result = await pool.query(`
      SELECT 1
      FROM curso
      WHERE institucion_id = $1
        AND anio = $2
        AND LOWER(TRIM(division)) = LOWER($3)
        ${filtro}
      LIMIT 1
    `, values);

    return result.rows.length > 0;
  };

  /** ¿La especialidad existe y pertenece a la institución? */
  especialidadPerteneceAsync = async (especialidadId, institucionId) => {
    const result = await pool.query(`
      SELECT 1 FROM especialidad WHERE id = $1 AND institucion_id = $2
    `, [especialidadId, institucionId]);

    return result.rows.length > 0;
  };

  createAsync = async ({ institucion_id, anio, division, especialidad_id }) => {
    const result = await pool.query(`
      INSERT INTO curso (institucion_id, anio, division, especialidad_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id AS curso_id, institucion_id, anio, division, especialidad_id
    `, [institucion_id, anio, String(division).trim(), especialidad_id || null]);

    return result.rows[0];
  };

  // El scope por institucion_id garantiza que un gestor sólo pueda tocar
  // cursos de su propia institución, igual que en comunicados.
  updateAsync = async (id, institucionId, { anio, division, especialidad_id }) => {
    const result = await pool.query(`
      UPDATE curso
      SET anio = $1,
          division = $2,
          especialidad_id = $3
      WHERE id = $4 AND institucion_id = $5
      RETURNING id AS curso_id, institucion_id, anio, division, especialidad_id
    `, [anio, String(division).trim(), especialidad_id || null, id, institucionId]);

    return result.rows[0] ?? null;
  };

  /**
   * Qué hay colgando del curso. Se consulta antes de borrar: la baja es
   * física (la tabla no tiene columna activo) y arrastraría alumnos,
   * materias, contenidos y trabajos prácticos por cascada.
   */
  getDependenciasAsync = async (id) => {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM alumno a WHERE a.curso_id = $1) AS alumnos,
        (SELECT COUNT(*)::int FROM curso_materia cm WHERE cm.curso_id = $1) AS materias
    `, [id]);

    return result.rows[0];
  };

  deleteAsync = async (id, institucionId) => {
    const result = await pool.query(`
      DELETE FROM curso
      WHERE id = $1 AND institucion_id = $2
      RETURNING id AS curso_id
    `, [id, institucionId]);

    return result.rows[0] ?? null;
  };
}
