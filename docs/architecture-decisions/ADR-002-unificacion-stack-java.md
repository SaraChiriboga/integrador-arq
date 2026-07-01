# ADR-002: Unificación del stack Java/Spring Boot para las APIs web

**Estado**: Aceptada
**Fecha**: 2026-06-24
**Responsable de la consolidación**: Paquete D (Anthonny)

## Contexto

El blueprint original (`BluePrintV3OSINT.drawio`) proponía Node.js para el backend del Portal Ciudadano (App2) y para el Servicio de Notificaciones (App4). Sin embargo, el equipo de 4 desarrolladores tiene mayor experiencia y velocidad de desarrollo comprobada en Java/Spring Boot, y el Compliance Engine (App3) ya requería Java/Spring Boot por su integración madura con Elasticsearch y Spring Data JPA.

## Decisión

Se estandariza **Java 17 + Spring Boot 3.x** como stack para las tres APIs web del sistema: Portal Ciudadano (App2), Compliance Engine (App3) y Servicio de Notificaciones (App4). Python se mantiene exclusivamente para el Worker OSINT (App1) por su ecosistema de scraping/consumo HTTP asíncrono (`httpx`, `asyncio`), y Node.js se mantiene exclusivamente para la Lambda de generación de PDF por la fidelidad de renderizado de Puppeteer/Chromium.

## Consecuencias

**Positivas**:
- Un solo conjunto de convenciones, dependencias y patrones (`RabbitMQConfig`, `application.yml` parametrizado con `${VAR:default}`, Lombok, `spring-boot-maven-plugin`) reutilizable entre App2, App3 y App4 — el código de Notificaciones (Paquete D) sigue exactamente el mismo patrón de `RabbitMQConfig` que ya usan App2 y App3.
- Facilita la revisión cruzada de código entre desarrolladores del equipo.
- Un único runtime (JDK 17) y una única imagen base (`eclipse-temurin:17-jre-jammy` / `openjdk:17-jdk-slim`) para 3 de los 4 servicios, simplificando el mantenimiento de Dockerfiles.

**Negativas / trade-offs asumidos**:
- Se pierde la propuesta original de Node.js para I/O intensivo en el Portal; se compensa con el uso de Redis como caché/candado de idempotencia y con el modelo asíncrono vía RabbitMQ, que evita que el hilo HTTP quede bloqueado.
- Tiempos de arranque en frío mayores que Node.js (mitigado en desarrollo, aceptable para este alcance académico).

**Nota de compatibilidad**: el equipo detectó que Lombok aún no es totalmente compatible con JDK 21+; se fija JDK 17 (Eclipse Temurin/Amazon Corretto) como versión soportada en todos los `pom.xml`.
