# APP 2 — Portal Ciudadano

Este componente está asignado a **Samu (Persona 2)**.

## 📂 Estructura
*   `/backend`: API REST en Java 17 + Spring Boot 3.x. Se abre con IntelliJ IDEA.
*   `/frontend`: SPA en React.js con Tailwind CSS y Vite. Se abre con VS Code.
*   `Dockerfile`: Para empaquetar la API.

## 🛠️ Tecnologías a utilizar
*   **Java 17 / Spring Boot 3.x** (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-data-redis`, `spring-boot-starter-amqp`).
*   **PostgreSQL 15** (`app2-postgres` en Docker) como persistencia relacional.
*   **Redis 7** (`app2-redis` en Docker) como caché de bloqueo e idempotencia (TTL 10 min).
*   **React + Vite + TypeScript + Tailwind CSS** para el frontend web.

## 🚀 Estrategia de Mock en Dev
1.  **Mock del Worker**: Para simular que el Worker terminó de procesar, puedes inyectar manualmente un evento de tipo `osint.completado` utilizando la consola web de RabbitMQ (`http://localhost:15672`). Tu backend de Spring Boot consumirá este evento, actualizará el estado de la solicitud en PostgreSQL y publicará el evento `reporte.listo`.
2.  **Validación de Cédula**: Implementa la validación del dígito verificador en React usando JavaScript estándar en el cliente para evitar que se envíen solicitudes inválidas al backend.
