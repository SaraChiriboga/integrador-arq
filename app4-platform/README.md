# APP 4 — Plataforma e Integración Transversal

Responsable: **Anthonny** (Paquete D — Integrador Técnico).

## 📂 Estructura

- `notifications/`: Servicio de Notificaciones en Java 17 + Spring Boot 3.2 (WebSockets STOMP + Spring AMQP), puerto `8082`. El envío de correo real ya **no** vive aquí — lo dispara el frontend de App2 vía EmailJS (ver ADR-005).
- `gateway-config/nginx.conf`: configuración del API Gateway (reverse proxy, TLS, rate limiting, CORS, WAF ligero).
- `rabbitmq-config/`: `definitions.json` + `rabbitmq.conf` — topología declarativa del bus de eventos (exchanges, DLX/DLQ, policies).
- `elk-config/logstash.conf`: pipeline de Logstash (entrada `gelf`, salida a Elasticsearch).
- `Dockerfile`: empaqueta el servicio de Notificaciones.
- `gateway.Dockerfile`: empaqueta el API Gateway (NGINX + certificado TLS autofirmado generado en build).

## 🛠️ Tecnologías utilizadas

- **Java 17 / Spring Boot 3.2** (`spring-boot-starter-websocket`, `spring-boot-starter-amqp`).
- **NGINX 1.25** con TLS autofirmado y `limit_req_zone` para Rate Limiting (20 req/min por IP).
- **RabbitMQ** (`rabbitmq:3-management-alpine`) con las exchanges/colas/DLQ definidas en `rabbitmq-config/definitions.json`.
- **ELK Stack** (Logstash + Kibana, reutilizando el Elasticsearch de App 3) para recolectar logs de stdout de los contenedores en formato JSON vía el driver nativo `gelf` de Docker.

## 🔌 Contratos de eventos que consume este paquete

| Cola propia | Exchange / routing key | Publicado por | Acción |
|---|---|---|---|
| `notificaciones.reporte.listo.queue` | `reporte.exchange` / `reporte.listo` | App2 | Push WebSocket a `/topic/reports/{requestId}` (el correo real lo dispara el frontend, ver `app2-portal/frontend/README.md` y ADR-005) |
| `notificaciones.alerta.compliance.queue` | `osint.exchange` / `alerta.compliance` | App3 | Push WebSocket a `/topic/compliance/alerts` |

## ✉️ Envío de correo real

El correo con el enlace del PDF ya **no** lo envía este servicio — lo dispara directamente el navegador del ciudadano vía **EmailJS**, apenas el *polling* del Portal Ciudadano detecta que el reporte quedó `COMPLETED`. Ver `docs/architecture-decisions/ADR-005-emailjs-frontend.md` para el porqué, y `app2-portal/frontend/.env` para la configuración (identificadores públicos, no credenciales).

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
2. Conecta un cliente WebSocket (STOMP/SockJS) a `/ws` y suscríbete a `/topic/reports/test-123` para ver el push en tiempo real (este servicio ya no envía el correo — eso lo prueba el frontend, ver punto 3).
3. Para probar el envío real de correo, usa el flujo completo desde el Portal Ciudadano (`app2-portal/frontend`) o llama directo a la API de EmailJS con los identificadores de `app2-portal/frontend/.env`.
4. Repite el flujo del punto 1 publicando en `notificaciones.alerta.compliance.queue` (exchange `osint.exchange`, routing key `alerta.compliance`) y suscribiéndote a `/topic/compliance/alerts`.
