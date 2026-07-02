# APP 4 — Plataforma e Integración Transversal

Responsable: **Anthonny** (Paquete D — Integrador Técnico).

## 📂 Estructura

- `notifications/`: Servicio de Notificaciones en Java 17 + Spring Boot 3.2 (WebSockets STOMP + Spring Mail + Spring AMQP), puerto `8082`.
- `gateway-config/nginx.conf`: configuración del API Gateway (reverse proxy, TLS, rate limiting, CORS, WAF ligero).
- `rabbitmq-config/`: `definitions.json` + `rabbitmq.conf` — topología declarativa del bus de eventos (exchanges, DLX/DLQ, policies).
- `elk-config/logstash.conf`: pipeline de Logstash (entrada `gelf`, salida a Elasticsearch).
- `Dockerfile`: empaqueta el servicio de Notificaciones.
- `gateway.Dockerfile`: empaqueta el API Gateway (NGINX + certificado TLS autofirmado generado en build).

## 🛠️ Tecnologías utilizadas

- **Java 17 / Spring Boot 3.2** (`spring-boot-starter-websocket`, `spring-boot-starter-mail`, `spring-boot-starter-amqp`).
- **NGINX 1.25** con TLS autofirmado y `limit_req_zone` para Rate Limiting (20 req/min por IP).
- **RabbitMQ** (`rabbitmq:3-management-alpine`) con las exchanges/colas/DLQ definidas en `rabbitmq-config/definitions.json`.
- **ELK Stack** (Logstash + Kibana, reutilizando el Elasticsearch de App 3) para recolectar logs de stdout de los contenedores en formato JSON vía el driver nativo `gelf` de Docker.
- **SMTP real** (Gmail por defecto, cualquier proveedor SMTP funciona) para el envío de correos — credenciales vía `.env` local (ver sección "Configurar el envío de correos").

## 🔌 Contratos de eventos que consume este paquete

| Cola propia | Exchange / routing key | Publicado por | Acción |
|---|---|---|---|
| `notificaciones.reporte.listo.queue` | `reporte.exchange` / `reporte.listo` | App2 | Envía email real (SMTP) + push WebSocket a `/topic/reports/{requestId}` |
| `notificaciones.alerta.compliance.queue` | `osint.exchange` / `alerta.compliance` | App3 | Push WebSocket a `/topic/compliance/alerts` |

## ✉️ Configurar el envío de correos (SMTP real)

El servicio de Notificaciones envía correos reales, no usa un servidor de pruebas. Antes de levantar `app4-notifications` necesitas:

1. Copiar `.env.example` (raíz del repo) a `.env` y completar tus credenciales:
   ```bash
   cp .env.example .env
   ```
2. Por defecto se usa **Gmail SMTP** (`smtp.gmail.com:587`). Requiere una [contraseña de aplicación](https://myaccount.google.com/apppasswords) de Google (no tu contraseña normal — Gmail la rechaza para SMTP). Otros proveedores (Outlook, SendGrid, Mailgun, etc.) funcionan igual, solo cambia `MAIL_HOST`/`MAIL_PORT` en tu `.env`.
3. `.env` está en `.gitignore` — **nunca** comitees credenciales reales.

Si `MAIL_USERNAME`/`MAIL_PASSWORD` no están definidas, `docker-compose up` falla rápido con un mensaje claro en vez de arrancar el contenedor sin poder enviar correos.

## 🚀 Cómo levantarlo localmente

Desde la raíz del repositorio:
```bash
docker-compose up -d
```
Esto construye y levanta **todo** el ecosistema (los 4 paquetes). Si solo quieres la plataforma transversal de este paquete:
```bash
docker-compose up -d app4-rabbitmq app4-localstack app4-notifications app4-gateway
```

Para levantar también el stack de observabilidad (ELK, apagado por defecto para ahorrar RAM):
```bash
docker-compose --profile elk up -d
```

### Endpoints útiles
- API Gateway (HTTPS con certificado autofirmado): https://localhost
- RabbitMQ Management UI: http://localhost:15672 (`guest` / `guest`)
- Kibana (si se activó el profile `elk`): http://localhost:5601
- WebSocket de Notificaciones (vía Gateway): `wss://localhost/ws` — tópicos `/topic/reports/{requestId}` y `/topic/compliance/alerts`

## 🧪 Estrategia de prueba manual (sin depender de App2/App3)

1. Abre la consola de RabbitMQ (`localhost:15672`) → **Queues** → `notificaciones.reporte.listo.queue` → **Publish message**, con un payload como:
   ```json
   { "requestId": "test-123", "pdfUrl": "https://ejemplo.com/reporte.pdf", "email": "tu-correo-real@ejemplo.com", "status": "COMPLETED" }
   ```
2. Verifica que llegue el correo a la bandeja indicada en `email` (correo real).
3. Conecta un cliente WebSocket (STOMP/SockJS) a `/ws` y suscríbete a `/topic/reports/test-123` para ver el push en tiempo real.
4. Repite el mismo flujo publicando en `notificaciones.alerta.compliance.queue` (exchange `osint.exchange`, routing key `alerta.compliance`) y suscribiéndote a `/topic/compliance/alerts`.
