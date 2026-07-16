# Notificaciones por email

Envío de emails transaccionales ante eventos de la plataforma, respetando la
preferencia `notificaciones_email` de cada usuario.

## Eventos que disparan mail

| Evento | Se dispara en | Destinatarios |
|---|---|---|
| **Corrección de TP** | `PUT /api/trabajos-practicos/:id/notas/:alumnoId` | El alumno corregido |
| **Nuevo TP publicado** | `PATCH /api/trabajos-practicos/:id/estado` (primera publicación) | Alumnos del curso |
| **Nuevo comunicado** | `POST /api/comunicados` | Todos los usuarios activos de la institución |

Todos los envíos:
- Sólo se mandan a usuarios con `notificaciones_email = true` y email cargado.
- Son **fire-and-forget**: si el email falla, la operación principal (corregir,
  publicar, crear) igual responde OK. Los errores se loguean, no se propagan.
- "Nuevo TP" usa `fecha_publicacion IS NULL` como guarda: sólo avisa la **primera**
  vez que se publica, aunque después se pase a borrador y se vuelva a publicar.

## Arquitectura

```
controller (trigger, sin await)
  └─ notificacionService  ← orquesta, nunca lanza
       ├─ notificacionRepository  ← destinatarios (ya filtra preferencia)
       ├─ emailTemplates          ← HTML de marca (subject/html/text)
       └─ emailService            ← POST a la API HTTP de Brevo
```

Se usa la **API HTTP de Brevo** (no SMTP) a propósito: el backend corre detrás
del proxy Fortinet que bloquea SMTP pero deja pasar HTTPS (igual que la IA).

## Configuración (Brevo)

1. Creá una cuenta gratis en <https://www.brevo.com> (300 emails/día, permite
   enviar a cualquier destinatario).
2. **Senders, Domains & Dedicated IPs → Senders**: agregá y **verificá** un email
   remitente (te llega un mail de confirmación). Ese email va en `EMAIL_FROM`.
3. **SMTP & API → API Keys**: creá una API key (empieza con `xkeysib-`).
4. Agregá al `.env` del backend:
   ```
   BREVO_API_KEY=xkeysib-...
   EMAIL_FROM=el-email-verificado@tu-dominio.com
   EMAIL_FROM_NAME=NEXIA
   APP_URL=http://localhost:5173
   ```
5. Reiniciá el backend (`npm run dev`).

> Sin `BREVO_API_KEY`, el sistema funciona igual pero **no envía** emails (loguea
> un aviso). Ideal para desarrollo sin credenciales.

## Probar

1. Asegurate de tener la columna `notificaciones_email` (migración
   `scripts/migracion-config-usuario.sql`) y un alumno con email real y
   `notificaciones_email = true`.
2. Como profesor, corregí una entrega de ese alumno → debería llegarle el mail.
3. Revisá la consola del backend: verás `[notif:correccion-tp] enviado a ...`.

## Agregar un evento nuevo

1. Sumá un builder en `helpers/emailTemplates.js` (devuelve `{ subject, html, text }`).
2. Agregá un método `notificarX` en `services/notificacionService.js` (envolvé todo
   en try/catch; nunca lances).
3. Llamalo desde el controller correspondiente **sin await** tras la operación exitosa.
