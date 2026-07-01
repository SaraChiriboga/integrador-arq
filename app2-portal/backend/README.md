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

## Justificación del TTL de 10 minutos en el lock de idempotencia (Redis)

El candado `lock:reporte:{cedula}` usa un TTL de 10 minutos por dos razones principales:

1. **Tiempo real de procesamiento del Worker OSINT:** según el diseño del Paquete A, el Worker consulta secuencialmente/concurrentemente 5 APIs gubernamentales externas (Registro Civil, ANT, SENESCYT, SRI, IESS), con una latencia esperada de entre 5 y 15 segundos por API. En el peor caso (fallos, reintentos con backoff exponencial), el proceso completo puede tomar varios minutos. Un TTL de 10 minutos da margen suficiente para que el flujo normal se complete sin que el lock expire prematuramente y permita una solicitud duplicada mientras el Worker sigue trabajando.
2. **Balance con la experiencia del usuario:** un TTL demasiado largo (ej: 1 hora) penalizaría innecesariamente a un ciudadano legítimo que necesita reintentar tras un fallo real del sistema, obligándolo a esperar sin necesidad. 10 minutos es suficiente para cubrir el caso feliz completo, pero no tan largo como para generar frustración si algo falla y el usuario necesita volver a intentar.

Es un valor configurable (no hardcodeado en múltiples lugares), por lo que puede ajustarse fácilmente si en producción se observa que el Worker requiere más o menos tiempo real de procesamiento.
