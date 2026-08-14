import MazoRepository from '../repositories/mazoRepository.js';

/* ─────────────────────────────────────────────
   SM-2 — la agenda de repaso.

   El alumno califica su propio recuerdo con cuatro
   botones, que se mapean a la escala 0..5 original:

     "Otra vez"  → 0   no me acordaba
     "Difícil"   → 3   me costó
     "Bien"      → 4   me acordaba
     "Fácil"     → 5   inmediato

   La idea del algoritmo: cada tarjeta lleva su
   propio factor de facilidad. Si la recordás, el
   intervalo se multiplica por ese factor y la
   tarjeta se va espaciando (1 día → 6 → 15 → 37…).
   Si fallás, vuelve a empezar y el factor baja, así
   la tarjeta reaparece seguido hasta que la fijás.
───────────────────────────────────────────── */

const FACTOR_MINIMO = 1.3;
const CALIDAD_APROBADA = 3;

/**
 * Calcula el nuevo estado de una tarjeta a partir de su estado anterior
 * y de cómo le fue al alumno.
 *
 * Función pura y exportada a propósito: es la única lógica no trivial de
 * todo el módulo y así se puede verificar sin base de datos.
 */
export function calcularSM2(estado, calidad) {
  const q = Math.min(Math.max(Number(calidad), 0), 5);

  const repeticionesPrevias = Number(estado.repeticiones) || 0;
  const factorPrevio = Number(estado.factor_facilidad) || 2.5;

  // El factor se ajusta SIEMPRE, incluso cuando la respuesta es incorrecta:
  // una tarjeta que se falla repetidas veces tiene que volverse más frecuente
  // de forma permanente, no sólo en el repaso siguiente.
  const factor = Math.max(
    FACTOR_MINIMO,
    factorPrevio + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  if (q < CALIDAD_APROBADA) {
    // Falló: vuelve al principio y reaparece mañana.
    return {
      repeticiones: 0,
      factor_facilidad: Number(factor.toFixed(2)),
      intervalo_dias: 1,
    };
  }

  const repeticiones = repeticionesPrevias + 1;

  let intervalo;
  if (repeticiones === 1) {
    intervalo = 1;
  } else if (repeticiones === 2) {
    intervalo = 6;
  } else {
    intervalo = Math.round((Number(estado.intervalo_dias) || 1) * factor);
  }

  return {
    repeticiones,
    factor_facilidad: Number(factor.toFixed(2)),
    // Tope de 1 año: sin él, una tarjeta muy fácil puede irse a intervalos
    // de varios años y desaparecer del repaso durante toda la secundaria.
    intervalo_dias: Math.min(Math.max(intervalo, 1), 365),
  };
}

export default class MazoService {
  constructor() {
    this.repo = new MazoRepository();
  }

  getMazosAsync = (alumnoId) => this.repo.getMazosAsync(alumnoId);
  getMazoAsync = (id, alumnoId) => this.repo.getMazoAsync(id, alumnoId);
  crearMazoAsync = (alumnoId, data) => this.repo.crearMazoAsync(alumnoId, data);
  actualizarMazoAsync = (id, alumnoId, data) => this.repo.actualizarMazoAsync(id, alumnoId, data);
  eliminarMazoAsync = (id, alumnoId) => this.repo.eliminarMazoAsync(id, alumnoId);

  getTarjetasAsync = (mazoId, alumnoId) => this.repo.getTarjetasAsync(mazoId, alumnoId);
  crearTarjetaAsync = (mazoId, alumnoId, data) => this.repo.crearTarjetaAsync(mazoId, alumnoId, data);
  actualizarTarjetaAsync = (id, alumnoId, data) => this.repo.actualizarTarjetaAsync(id, alumnoId, data);
  eliminarTarjetaAsync = (id, alumnoId) => this.repo.eliminarTarjetaAsync(id, alumnoId);

  getPendientesAsync = (alumnoId, mazoId) => this.repo.getPendientesAsync(alumnoId, mazoId);
  contarPendientesAsync = (alumnoId) => this.repo.contarPendientesAsync(alumnoId);

  /**
   * Registra el resultado de un repaso.
   *
   * El estado previo se lee de la base y no del cliente: si el frontend
   * mandara el factor y el intervalo, un alumno podría alterarlos y su agenda
   * de repaso dejaría de reflejar lo que realmente sabe.
   *
   * Devuelve null si la tarjeta no existe o no es suya, para que el controller
   * responda 404 en vez de crear un estado de la nada.
   */
  registrarRepasoAsync = async (tarjetaId, alumnoId, calidad) => {
    const estado = await this.repo.getTarjetaAsync(tarjetaId, alumnoId);
    if (!estado) return null;

    const nuevo = calcularSM2(estado, calidad);
    return await this.repo.guardarRepasoAsync(tarjetaId, alumnoId, nuevo);
  };
}
