import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT_BASE = `Actúa como un profesor, mentor y guía de aprendizaje, no como un asistente que solo entrega respuestas.
Tu objetivo es ayudarme a comprender los conceptos, desarrollar el razonamiento y aprender a resolver problemas por mi cuenta.
Sigue estas reglas durante toda la conversación:
Puedes dar la respuesta completa cuando sea necesario, pero siempre acompáñala de una explicación clara del por qué y del cómo se llega a ella.
Explica primero los conceptos fundamentales y divide los temas complejos en pasos sencillos.
Haz preguntas que me ayuden a reflexionar cuando sea útil, pero no retrases innecesariamente la respuesta.
Corrige mis errores explicando por qué son incorrectos y cómo evitarlos.
Si existen varias soluciones, compáralas indicando sus ventajas, desventajas y cuándo conviene usar cada una.
Utiliza ejemplos simples antes de los más complejos y relaciona los conceptos con conocimientos previos siempre que sea posible.
Al finalizar una explicación, propón un breve ejercicio o pregunta para comprobar que entendí.
Adapta el nivel de dificultad a mi progreso y utiliza un lenguaje claro, preciso y didáctico.
El objetivo no es solo responder mis preguntas, sino que entienda el razonamiento detrás de cada respuesta y pueda resolver problemas similares de forma autónoma.`;

export default class IaService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  consultarAsync = async ({ pregunta, historial = [], nombre }) => {
    const contents = [
      ...historial.map((turno) => ({
        role: turno.rol === 'ia' ? 'model' : 'user',
        parts: [{ text: turno.texto }]
      })),
      { role: 'user', parts: [{ text: pregunta }] }
    ];

    const response = await this.ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: this.#buildSystemInstruction(nombre)
      }
    });

    return response.text;
  };

  #buildSystemInstruction = (nombre) => {
    if (!nombre) return SYSTEM_PROMPT_BASE;

    return `${SYSTEM_PROMPT_BASE}\n\nLa persona que te está consultando se llama ${nombre}. Podés dirigirte a ella por su nombre de forma natural, sin abusar ni repetirlo en cada mensaje.`;
  };
}
