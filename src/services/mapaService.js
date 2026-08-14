import MapaRepository from '../repositories/mapaRepository.js';

/* Mapas conceptuales — el grafo se valida acá antes de llegar a la base. */

const MAX_NODOS = 200;
const MAX_CONEXIONES = 400;

export class MapaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MapaError';
  }
}

/**
 * Normaliza el grafo que manda el canvas.
 *
 * Se reconstruye nodo por nodo en vez de guardar el JSON tal cual: la columna
 * es JSONB y aceptar la forma del cliente sin filtrar dejaría entrar cualquier
 * cosa, incluidos objetos enormes o anidados que después romperían el render.
 */
function normalizarDatos(datos) {
  if (datos === undefined || datos === null) return undefined;

  if (typeof datos !== 'object' || Array.isArray(datos)) {
    throw new MapaError('El mapa tiene un formato inválido');
  }

  const nodosCrudos = Array.isArray(datos.nodos) ? datos.nodos : [];
  const conexionesCrudas = Array.isArray(datos.conexiones) ? datos.conexiones : [];

  if (nodosCrudos.length > MAX_NODOS) {
    throw new MapaError(`Un mapa admite hasta ${MAX_NODOS} conceptos`);
  }
  if (conexionesCrudas.length > MAX_CONEXIONES) {
    throw new MapaError(`Un mapa admite hasta ${MAX_CONEXIONES} conexiones`);
  }

  const nodos = nodosCrudos.map((n) => ({
    id: String(n.id),
    texto: String(n.texto ?? '').slice(0, 160),
    x: Number.isFinite(Number(n.x)) ? Number(n.x) : 0,
    y: Number.isFinite(Number(n.y)) ? Number(n.y) : 0,
    tipo: n.tipo === 'principal' ? 'principal' : 'secundario',
  }));

  // Sólo sobreviven las conexiones cuyos dos extremos existen: si un nodo se
  // borró en el cliente y quedó una conexión colgada, dibujaría una línea
  // hacia la nada.
  const ids = new Set(nodos.map((n) => n.id));
  const conexiones = conexionesCrudas
    .filter((c) => ids.has(String(c.de)) && ids.has(String(c.a)) && String(c.de) !== String(c.a))
    .map((c) => ({
      de: String(c.de),
      a: String(c.a),
      etiqueta: String(c.etiqueta ?? '').slice(0, 80),
    }));

  return { nodos, conexiones };
}

export default class MapaService {
  constructor() {
    this.repo = new MapaRepository();
  }

  getTodosAsync = (alumnoId) => this.repo.getTodosAsync(alumnoId);
  getPorIdAsync = (id, alumnoId) => this.repo.getPorIdAsync(id, alumnoId);

  crearAsync = (alumnoId, { titulo, datos }) =>
    this.repo.crearAsync(alumnoId, {
      titulo: String(titulo).trim().slice(0, 160),
      datos: normalizarDatos(datos) ?? { nodos: [], conexiones: [] },
    });

  actualizarAsync = (id, alumnoId, { titulo, datos }) =>
    this.repo.actualizarAsync(id, alumnoId, {
      titulo: titulo !== undefined ? String(titulo).trim().slice(0, 160) : undefined,
      datos: normalizarDatos(datos),
    });

  eliminarAsync = (id, alumnoId) => this.repo.eliminarAsync(id, alumnoId);
}
