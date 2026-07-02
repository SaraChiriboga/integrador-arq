# ADR-005: Envío de correo real desde el frontend (EmailJS) en vez de SMTP en el backend

**Estado**: Aceptada (reemplaza el enfoque intermedio de SMTP en `app4-notifications`)
**Fecha**: 2026-07-02
**Responsable de la consolidación**: Paquete D (Anthonny)

## Contexto

La primera versión del Servicio de Notificaciones usaba Mailhog (servidor SMTP de pruebas) para no enviar correos reales durante desarrollo. Al pedir envío real, la primera solución fue configurar `spring-boot-starter-mail` en `app4-notifications` contra un SMTP real (Gmail), con las credenciales en un `.env` local por desarrollador.

Ese enfoque funcionaba, pero tenía una fricción operativa real para un equipo de estudiantes: **cada persona que clonara el repo necesitaba generar su propia contraseña de aplicación de Google** y configurarla localmente antes de poder ver un correo real, solo para poder probar el flujo. Eso no es aceptable para un proyecto donde varios compañeros necesitan correr la demo rápido.

## Decisión

El envío de correo real se mueve al **frontend** (`app2-portal/frontend`), usando **EmailJS** (`@emailjs/browser`) para enviarlo directo desde el navegador del ciudadano, sin pasar por ningún backend con credenciales SMTP:

- `StatusPage.tsx` detecta cuando el *polling* del estado del reporte cambia a `COMPLETED` y dispara `sendReportReadyEmail()` una sola vez (con un `useRef` como guarda contra reenvíos por el propio polling).
- El correo del ciudadano se guarda en `localStorage` al enviar el formulario en `HomePage.tsx` (el backend no lo expone en `GET /api/v1/reports/{id}`, así que se pasa por el cliente).
- La cuenta de Gmail que efectivamente envía los correos se conecta **una sola vez**, por un integrante del equipo, directamente en el dashboard de EmailJS (vía OAuth) — nunca en el código.
- Los 3 identificadores que sí quedan en el repo (`VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, en `app2-portal/frontend/.env`) son **públicos por diseño de EmailJS** — no son secretos, es seguro comitearlos y compartirlos.
- `app4-platform/notifications` deja de tener `spring-boot-starter-mail` y `EmailService`; el `ReporteListoListener` solo reenvía el push por WebSocket (`/topic/reports/{requestId}`), que sigue siendo útil para actualizar la UI en tiempo real sin depender del polling.

## Consecuencias

**Positivas**:
- **Cero configuración adicional** para cualquiera que clone el repo: el envío de correo funciona igual para todo el equipo sin que cada quien conecte su propia cuenta de correo.
- Elimina por completo el riesgo de subir una contraseña SMTP al repositorio por accidente (ya había ocurrido una vez que la contraseña de aplicación quedó expuesta en una captura de pantalla durante el desarrollo, lo que obligó a revocarla).
- Reduce la superficie de `app4-notifications`: ya no maneja secretos ni protocolos SMTP, solo AMQP y WebSockets.

**Negativas / trade-offs asumidos**:
- El envío de correo ahora depende de que el **navegador del ciudadano** ejecute JavaScript y tenga conexión saliente a `api.emailjs.com` — si el usuario cierra la pestaña antes de que el polling detecte `COMPLETED`, el correo no se dispara (mitigado parcialmente por el push de WebSocket, que sigue notificando en tiempo real dentro de la sesión activa, pero tampoco sobrevive el cierre de pestaña).
- Se introduce una dependencia de un servicio SaaS de terceros (EmailJS) con límites de la capa gratuita (200 correos/mes) — suficiente para el alcance de este proyecto académico, pero no para producción a escala.
- La lógica de "enviar correo" pasa a vivir en el cliente en vez de en un servicio backend auditable; se acepta este trade-off porque el proyecto prioriza que el equipo pueda levantar la demo sin fricción de credenciales por encima de la robustez de un flujo 100% server-side.
