import pool from '../database/db.js';

export default class GestorRepository {
  crearGestorAsync = async ({ nombre, dni, password, institucion_id }) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const gestorResult = await client.query(`
        INSERT INTO gestor (nombre, dni, password)
        VALUES ($1, $2, $3)
        RETURNING id, nombre, dni
      `, [nombre, dni, password]);

      const gestor = gestorResult.rows[0];

      if (institucion_id) {
        await client.query(`
          UPDATE institucion
          SET gestor_id = $1
          WHERE id = $2
        `, [gestor.id, institucion_id]);
      }

      await client.query('COMMIT');

      return gestor;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  crearAlumnoAsync = async ({
    institucion_id,
    nombre,
    apellido,
    email,
    password,
    dni,
    curso_id
  }) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const usuarioResult = await client.query(`
        INSERT INTO usuario (
          institucion_id,
          nombre,
          apellido,
          email,
          password,
          dni,
          rol,
          activo
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'ALUMNO', true)
        RETURNING id, institucion_id, nombre, apellido, email, dni, rol, activo
      `, [institucion_id, nombre, apellido, email, password, dni]);

      const usuario = usuarioResult.rows[0];

      const alumnoResult = await client.query(`
        INSERT INTO alumno (usuario_id, curso_id)
        VALUES ($1, $2)
        RETURNING *
      `, [usuario.id, curso_id]);

      await client.query('COMMIT');

      return {
        usuario,
        alumno: alumnoResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  crearProfesorAsync = async ({
    institucion_id,
    nombre,
    apellido,
    email,
    password,
    dni
  }) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const usuarioResult = await client.query(`
        INSERT INTO usuario (
          institucion_id,
          nombre,
          apellido,
          email,
          password,
          dni,
          rol,
          activo
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'PROFESOR', true)
        RETURNING id, institucion_id, nombre, apellido, email, dni, rol, activo
      `, [institucion_id, nombre, apellido, email, password, dni]);

      const usuario = usuarioResult.rows[0];

      const profesorResult = await client.query(`
        INSERT INTO profesor (usuario_id)
        VALUES ($1)
        RETURNING *
      `, [usuario.id]);

      await client.query('COMMIT');

      return {
        usuario,
        profesor: profesorResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  asignarAlumnoACursoAsync = async (alumnoId, cursoId) => {
    const result = await pool.query(`
      UPDATE alumno
      SET curso_id = $1
      WHERE id = $2
      RETURNING *
    `, [cursoId, alumnoId]);

    return result.rows[0] || null;
  };

  asignarProfesorAMateriaAsync = async ({
    profesor_id,
    curso_id,
    materia_id
  }) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let cursoMateriaResult = await client.query(`
        SELECT *
        FROM curso_materia
        WHERE curso_id = $1
          AND materia_id = $2
        LIMIT 1
      `, [curso_id, materia_id]);

      let cursoMateria = cursoMateriaResult.rows[0];

      if (!cursoMateria) {
        const insertCursoMateria = await client.query(`
          INSERT INTO curso_materia (curso_id, materia_id)
          VALUES ($1, $2)
          RETURNING *
        `, [curso_id, materia_id]);

        cursoMateria = insertCursoMateria.rows[0];
      }

      let profeCursoMateriaResult = await client.query(`
        SELECT *
        FROM profe_curso_materia
        WHERE curso_materia_id = $1
          AND profesor_id = $2
        LIMIT 1
      `, [cursoMateria.id, profesor_id]);

      let profeCursoMateria = profeCursoMateriaResult.rows[0];

      if (!profeCursoMateria) {
        const insertProfeCursoMateria = await client.query(`
          INSERT INTO profe_curso_materia (curso_materia_id, profesor_id)
          VALUES ($1, $2)
          RETURNING *
        `, [cursoMateria.id, profesor_id]);

        profeCursoMateria = insertProfeCursoMateria.rows[0];
      }

      await client.query('COMMIT');

      return {
        curso_materia: cursoMateria,
        profe_curso_materia: profeCursoMateria
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };
}