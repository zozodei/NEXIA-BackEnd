# Tutor IA (Gemini) — Instrucciones para el Frontend

## Importante: cambio de arquitectura respecto al test que hicieron

El test que pasaron llamaba a Gemini **directo desde el navegador**, con la API key visible en el JS del cliente. Eso expone la key a cualquiera que abra el inspector del navegador. Ahora la key vive **solo en el backend** (`.env`, nunca se manda al front). El frontend no debe importar `@google/genai` ni tener la key en ningún lado — solo tiene que llamar a nuestro propio endpoint.

---

## Endpoint

`POST /api/ia/consulta`

Requiere header `Authorization: Bearer <token>` (mismo JWT de siempre). Funciona para cualquier rol logueado (alumno, profesor, gestor, directivo).

**Body:**
```json
{
  "pregunta": "¿Cómo resuelvo una ecuación de segundo grado?",
  "historial": [
    { "rol": "usuario", "texto": "Hola, tengo una duda de matemática" },
    { "rol": "ia", "texto": "¡Hola! Contame qué es lo que te está costando..." }
  ]
}
```

- `pregunta` (string, **obligatorio**): el mensaje actual del usuario.
- `historial` (array, **opcional**): los mensajes previos de la conversación, en orden, para que la IA mantenga contexto. Cada item es `{ rol: "usuario" | "ia", texto: "..." }`. Si no se manda, se trata como una conversación nueva.

**Respuesta:**
```json
{ "ok": true, "message": "Respuesta generada correctamente", "data": { "respuesta": "..." } }
```

## Cómo armar el chat en el front

El backend **no guarda historial** (no hay tabla ni sesión en el servidor). El front tiene que mantener el array de mensajes en su propio estado (o localStorage si querés que sobreviva un refresh) y mandar ese `historial` completo en cada request nuevo, agregando la respuesta de la IA a la lista después de cada llamada. Ejemplo de flujo:

1. Usuario escribe "¿qué es una función lineal?" → front tiene `historial = []`.
2. POST `/api/ia/consulta` con `{ pregunta: "...", historial: [] }`.
3. Llega `data.respuesta` → el front la muestra y la agrega al array: `historial = [{rol:"usuario", texto:"..."}, {rol:"ia", texto: data.respuesta}]`.
4. Usuario escribe otra pregunta → se manda de nuevo `historial` (ahora con esos 2 mensajes) + la nueva `pregunta`.

Si la conversación se hace muy larga, tiene sentido que el front recorte el historial (por ejemplo, mandar solo los últimos 10-15 mensajes) para no mandar payloads gigantes — no es obligatorio para el MVP, pero es una mejora a considerar.

## Personalización automática

No hace falta mandar el nombre del alumno ni ningún dato de quién pregunta: el backend lo saca solo del token (`req.user.nombre`) y se lo pasa a la IA para que lo salude/trate por su nombre cuando sea natural. El front solo manda `pregunta` y `historial`.

## Comportamiento esperado de las respuestas

El prompt de sistema (fijo, en el backend, no lo toca el front) hace que la IA actúe como tutor socrático: no da la respuesta directa salvo que se la pidan explícitamente, hace preguntas guía, corrige explicando por qué algo está mal en vez de solo dar el resultado correcto. Esto ya está probado contra la API real y funciona (ej: ante "¿cuánto es 2+2?" no responde "4", pregunta qué significa sumar). El front no necesita hacer nada especial para esto, es comportamiento del modelo — pero conviene que la UI del chat esté pensada para respuestas más largas/tipo explicación, no solo un dato corto.

## Errores a manejar

- `400 "Faltan campos: pregunta"` → no se mandó `pregunta`.
- `401` → token vencido o ausente (igual que en el resto de la app).
- `500` → falló la llamada a Gemini (rate limit, corte de red, etc.). Mostrar algo tipo "No se pudo conectar con el tutor IA, intentá de nuevo" y permitir reintentar.

## Nota de entorno (no bloquea nada, es solo un aviso)

Al probar la integración desde esta PC encontré un error de certificado TLS (`self-signed certificate in certificate chain`) causado por la red/proxy de esta sandbox, no por el código. Confirmé que la key y el armado del prompt funcionan correctamente (recibí una respuesta real y coherente de Gemini). Si al correr el backend en tu máquina ven ese mismo error, es la red corporativa interceptando HTTPS — la solución no es desactivar la verificación TLS (inseguro), sino conseguir el certificado raíz de la empresa/proxy y configurar la variable de entorno `NODE_EXTRA_CA_CERTS` apuntando a ese archivo `.pem` antes de levantar el server.
