# Portal Ciudadano (App 2)

Este directorio contiene el desarrollo del Portal Ciudadano, separado en su frontend y backend.

## Documentación del Paquete

A continuación se listan los entregables generados para la documentación técnica:

- **Esquema SQL:** [backend/docs/schema.sql](backend/docs/schema.sql)
- **Diagrama C4 de componente:** 
  - Archivo fuente editable en app.diagrams.net: [docs/c4-diagrams/c4-componente-app2-portal.drawio](docs/c4-diagrams/c4-componente-app2-portal.drawio)
  - Versión en imagen: [docs/c4-diagrams/c4-componente-app2-portal.png](docs/c4-diagrams/c4-componente-app2-portal.png)

## Justificación del TTL de Redis (10 minutos)

El candado `lock:reporte:{cedula}` usa un TTL de 10 minutos por dos razones:

1. **Tiempo real de procesamiento del Worker OSINT**: el Worker consulta secuencialmente/concurrentemente 5 APIs gubernamentales externas, con latencia esperada de 5-15 segundos por API. En el peor caso (fallos, reintentos con backoff exponencial), el proceso completo puede tomar varios minutos. 10 minutos da margen suficiente para que el flujo normal se complete sin que el lock expire prematuramente.

2. **Balance con la experiencia del usuario**: un TTL más largo penalizaría innecesariamente a un ciudadano legítimo que necesita reintentar tras un fallo real del sistema. 10 minutos cubre el caso feliz completo sin generar frustración excesiva si algo falla.

Es un valor configurable, ajustable si en producción se observa que el Worker requiere más o menos tiempo real de procesamiento.
