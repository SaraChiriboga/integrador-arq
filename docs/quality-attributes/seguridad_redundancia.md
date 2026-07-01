# Atributos de Calidad — Seguridad, Redundancia y Disponibilidad (App 4 / Paquete D)

Esta sección justifica las decisiones de seguridad perimetral y disponibilidad tomadas en la Plataforma Transversal (Gateway, RabbitMQ, Notificaciones), y cierra el punto pendiente de `docs/quality-attributes/README.md`. Complementa (no duplica) las secciones ya escritas por los otros 3 paquetes:
- Paquete A: [`app1-rate-limiting.md`](./app1-rate-limiting.md) — concurrencia y resiliencia del Worker.
- Paquete B: [`app2-cache-idempotency.md`](./app2-cache-idempotency.md) — caché e idempotencia con Redis.
- Paquete C: indexación y búsqueda con Elasticsearch (ver `docs/quality-attributes/README.md`).

---

## 1. Seguridad Perimetral (WAF ligero + Rate Limiting)

**El problema**: el API Gateway es el único punto de entrada público del sistema; debe protegerse contra picos de tráfico (accidentales o DDoS) y contra los patrones de inyección más comunes antes de que la petición llegue a cualquier backend.

**La solución implementada**: `app4-platform/gateway-config/nginx.conf` aplica:
- **Rate limiting** con `limit_req_zone` a razón de 20 peticiones/minuto por IP (`$binary_remote_addr`), con un *burst* controlado de 5 peticiones antes de responder `429 Too Many Requests`.
- **"WAF ligero"** vía un bloque `map` que inspecciona `$request_uri` en busca de patrones típicos de path traversal, SQLi y XSS (`../`, `union select`, `drop table`, `<script`, `' or '1'='1`, etc.) y responde `403 Forbidden` si coincide. Esto es una simplificación razonable para el alcance académico del proyecto — **no reemplaza** un WAF de producción como ModSecurity + OWASP CRS, que requeriría un módulo NGINX adicional y un conjunto de reglas mucho más amplio.
- Cabeceras de *hardening* (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy` básica).

## 2. TLS en tránsito

Se genera un certificado autofirmado en tiempo de build (`app4-platform/gateway.Dockerfile`, `openssl req -x509`) y el Gateway escucha en `443` con redirección forzada desde `80`. En un entorno productivo real, este certificado se reemplazaría por uno emitido por una CA (p.ej. Let's Encrypt) sin cambiar la configuración de `nginx.conf`.

## 3. Autenticación (JWT)

La validación de JWT/OAuth2 se delega a cada backend (App2 y App3), no al Gateway — decisión consciente para mantener a NGINX simple y sin estado de sesión. El Gateway solo enruta y aplica las políticas perimetrales descritas arriba; el blueprint original (`BluePrintV3OSINT.drawio`, componente "Auth JWT / OAuth2") se satisface a nivel de aplicación.

## 4. Redundancia y Ausencia de Punto Único de Fallo (SPOF)

Ver también ADR-003. Cada aplicación tiene su propia base de datos en su propia red aislada; si `app1-worker` o la Lambda PDF caen, las solicitudes se acumulan de forma segura en `solicitud.osint.queue` (RabbitMQ persiste mensajes en disco, `rabbitmq_data` volume) y se procesan al recuperarse el worker, sin perder ninguna solicitud del ciudadano.

**Manejo de mensajes "envenenados"**: `app4-platform/rabbitmq-config/definitions.json` declara el exchange `osint.dlx` (direct) y las colas `solicitud.dlq` / `completado.dlq`, enlazadas mediante **policies** (no redeclaración de argumentos de cola) a `solicitud.osint.queue`, `osint.completado.queue` y `compliance.osint.completado.queue`. Esto permite aislar mensajes corruptos sin modificar el código de otros paquetes.

> ⚠️ **Observación para el equipo**: el mecanismo de *dead-lettering* funciona correctamente en `app3-compliance` porque su `application.yml` ya configura `spring.rabbitmq.listener.simple.retry` (3 intentos, luego rechaza sin reencolar). El backend de `app2-portal` **no** tiene ese mismo bloque de retry configurado — sin él, un mensaje que falle se reencola indefinidamente en vez de terminar en `completado.dlq` tras 3 intentos. Se recomienda a Samu añadir el mismo bloque `spring.rabbitmq.listener.simple.retry` que ya usa App3 para que el DLQ sea efectivo también en `osint.completado.queue`.

## 5. Aislamiento de red como control de seguridad

Las 4 redes Docker (`net-app1`, `net-app2`, `net-app3`, `net-transit`) garantizan que, por ejemplo, `app1-worker` no puede alcanzar `app3-postgres` directamente aunque quisiera — toda comunicación entre apps pasa por RabbitMQ en `net-transit`. Las únicas excepciones deliberadas son el Gateway (necesita hablar con `app2-backend` y `app3-backend` para enrutar) y `app3-elasticsearch`/`app4-localstack` (infraestructura compartida ya presente en el diseño original). Ver `docs/infrastructure/topologia-red-docker.drawio`.
