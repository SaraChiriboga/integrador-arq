# Portal Ciudadano Backend

Este es el proyecto backend del Portal Ciudadano, desarrollado con Spring Boot 3 y Java 17.

## Requisitos Previos
- Java 17
- Maven
- Docker y Docker Compose

## Ejecución Local

Para levantar el proyecto localmente y conectarse a la infraestructura existente en Docker Compose:

1. Asegúrate de tener levantados los contenedores necesarios usando Docker Compose desde la raíz del monorepo:
   ```bash
   docker-compose up -d app2-postgres app2-redis app4-rabbitmq
   ```
2. Ejecuta el proyecto usando Maven:
   ```bash
   mvn spring-boot:run
   ```

La aplicación se ejecutará utilizando valores por defecto para conectarse a `localhost` en los puertos expuestos por Docker Compose.
