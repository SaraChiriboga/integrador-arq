# APP 4 — Plataforma e Integración Transversal

Este componente está asignado a **Persona 4** (por definir) - Integrador Técnico.

## 📂 Estructura
*   `/notifications`: Servicio de Notificaciones en Java 17 + Spring Boot 3.x (WebSockets + Spring Mail).
*   `/gateway-config`: Configuración de proxy reverso y Rate Limiting en NGINX.
*   `Dockerfile`: Para empaquetar el microservicio de notificaciones.

## 🛠️ Tecnologías a utilizar
*   **Java 17 / Spring Boot 3.x** (`spring-boot-starter-websocket`, `spring-boot-starter-mail`, `spring-boot-starter-amqp`).
*   **NGINX** (con configuración TLS local y directivas `limit_req_zone` para Rate Limiting).
*   **RabbitMQ** (`rabbitmq:3-management-alpine`) con bindings para:
    *   `solicitud.queue` -> `solicitud.osint`
    *   `completado.queue` -> `osint.completado`
    *   `alerta.queue` -> `alerta.compliance`
    *   `notificacion.queue` -> `reporte.listo` y `alerta.compliance`
*   **ELK Stack** (Elasticsearch, Logstash, Kibana) para recolectar logs de stdout de los contenedores Docker en formato JSON.

## 🚀 Estrategia de Mock en Dev
1.  **Orquestación**: La Persona 4 debe entregar el archivo `docker-compose.yml` en la raíz del proyecto para que todos los desarrolladores tengan acceso a las bases de datos y RabbitMQ local.
2.  **Notificaciones**: Inyecta manualmente eventos `reporte.listo` o `alerta.compliance` en RabbitMQ y comprueba que el servicio envía el correo SMTP a Mailhog (`http://localhost:8025`) y el WebSocket por el puerto de notificaciones.
