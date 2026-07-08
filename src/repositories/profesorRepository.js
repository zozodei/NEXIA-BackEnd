import pool from '../database/db.js';

export default class ProfesorRepository {
  getAllAsync = async (institucionId = null) => {
    const values = [];
    let filtro = '';

    if (institucionId) {
      values.push(institucionId);
      filtro = 'WHERE u.institucion_id = $1';
    }

    const result = await pool.query(`
      SELECT
        p.id AS profesor_id,
        u.id AS usuario_id,
        u.institucion_id,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.activo
      FROM profesor p
      INNER JOIN usuario u ON u.id = p.usuario_id
      ${filtro}
      ORDER BY u.apellido, u.nombre
    `, values);

    return result.rows;
  };

  getByIdAsync = async (profesorId) => {
    const result = await pool.query(`
      SELECT
        p.id AS profesor_id,
        u.id AS usuario_id,
        u.institucion_id,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.activo
      FROM profesor p
      INNER JOIN usuario u ON u.id = p.usuario_id
      WHERE p.id = $1
    `, [profesorId]);

    return result.rows[0] || null;
  };

  getMateriasAsync = async (profesorId) => {
    const result = await pool.query(`
      SELECT
        pcm.id AS profe_curso_materia_id,
        p.id AS profesor_id,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        m.descripcion AS materia_descripcion,
        c.id AS curso_id,
        c.anio,
        c.division,
        e.id AS especialidad_id,
        e.nombre AS especialidad_nombre
      FROM profesor p
      INNER JOIN profe_curso_materia pcm ON pcm.profesor_id = p.id
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      LEFT JOIN especialidad e ON e.id = c.especialidad_id
      WHERE p.id = $1
      ORDER BY c.anio, c.division, m.nombre
    `, [profesorId]);

    return result.rows;
  };

  /* Alumnos en riesgo en las materias del profesor:
     - promedio de TPs corregidos < 6
     - TPs publicados ya vencidos sin entrega */
  getAlumnosEnRiesgoAsync = async (profesorId) => {
    const promedioBajo = await pool.query(`
      SELECT
        al.id AS alumno_id,
        u.nombre AS alumno_nombre,
        u.apellido AS alumno_apellido,
        m.nombre AS materia_nombre,
        c.anio,
        c.division,
        ROUND(AVG(e.nota), 1) AS promedio
      FROM profe_curso_materia pcm
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      INNER JOIN trabajo_practico tp ON tp.profe_curso_materia_id = pcm.id
      INNER JOIN entrega e ON e.trabajo_practico_id = tp.id AND e.estado = 'corregido'
      INNER JOIN alumno al ON al.id = e.alumno_id
      INNER JOIN usuario u ON u.id = al.usuario_id
      WHERE pcm.profesor_id = $1
      GROUP BY al.id, u.nombre, u.apellido, m.nombre, c.anio, c.division
      HAVING AVG(e.nota) < 6
    `, [profesorId]);

    const sinEntregar = await pool.query(`
      SELECT
        al.id AS alumno_id,
        u.nombre AS alumno_nombre,
        u.apellido AS alumno_apellido,
        m.nombre AS materia_nombre,
        c.anio,
        c.division,
        COUNT(*) AS tps_sin_entregar
      FROM profe_curso_materia pcm
      INNER JOIN curso_materia cm ON cm.id = pcm.curso_materia_id
      INNER JOIN materia m ON m.id = cm.materia_id
      INNER JOIN curso c ON c.id = cm.curso_id
      INNER JOIN trabajo_practico tp
        ON tp.profe_curso_materia_id = pcm.id
        AND tp.activo = true
        AND tp.fecha_limite IS NOT NULL
        AND tp.fecha_limite < NOW()
      INNER JOIN alumno al ON al.curso_id = c.id
      INNER JOIN usuario u ON u.id = al.usuario_id
      LEFT JOIN entrega e ON e.trabajo_practico_id = tp.id AND e.alumno_id = al.id
      WHERE pcm.profesor_id = $1 AND e.id IS NULL
      GROUP BY al.id, u.nombre, u.apellido, m.nombre, c.anio, c.division
    `, [profesorId]);

    // Merge por alumno+materia: un mismo alumno puede tener ambos motivos
    const porClave = new Map();

    for (const row of promedioBajo.rows) {
      const clave = row.alumno_id + '|' + row.materia_nombre;
      porClave.set(clave, { ...row, promedio: Number(row.promedio), tps_sin_entregar: 0 });
    }

    for (const row of sinEntregar.rows) {
      const clave = row.alumno_id + '|' + row.materia_nombre;
      const existente = porClave.get(clave);
      if (existente) {
        existente.tps_sin_entregar = Number(row.tps_sin_entregar);
      } else {
        porClave.set(clave, { ...row, promedio: null, tps_sin_entregar: Number(row.tps_sin_entregar) });
      }
    }

    return Array.from(porClave.values())
      .sort((a, b) => (a.promedio ?? 10) - (b.promedio ?? 10));
  };
}
