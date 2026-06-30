# APP 3 — Dashboard Monitor Compliance

Este componente está asignado a **Persona 3** (por definir).

## 📂 Estructura
*   `/backend`: API REST de cumplimiento en Java 17 + Spring Boot 3.x.
*   `/frontend`: Dashboard en React.js con Tailwind CSS para los oficiales de cumplimiento.
*   `Dockerfile`: Para empaquetar la API.

## 🛠️ Tecnologías a utilizar
*   **Java 17 / Spring Boot 3.x** (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-data-elasticsearch`, `spring-boot-starter-amqp`).
*   **PostgreSQL 15** (`app3-postgres` en Docker) como persistencia relacional para alertas de cumplimiento.
*   **Elasticsearch 8.x** (`app3-elasticsearch` en Docker) para búsqueda de texto completo rápida.
*   **React + Tailwind CSS** para el dashboard web de analistas.
*   **API OpenSanctions**: Integración con el endpoint `/match` para búsqueda difusa (fuzzy search) de PEPs y personas sancionadas.

## 🚀 Estrategia de Mock en Dev
1.  **Mock de OpenSanctions**: Implementa una clase `@Service` anotada con `@Profile("dev")` que intercepte las llamadas HTTP a OpenSanctions y use un algoritmo local simple (comparación de strings) contra una lista en memoria (ej. si el nombre contiene "Juan Perez", devuelve un match del 90%).
2.  **Inyección de Datos**: Para probar el indexador de Elasticsearch, publica manualmente eventos `osint.completado` con datos agregados en la cola de RabbitMQ.
