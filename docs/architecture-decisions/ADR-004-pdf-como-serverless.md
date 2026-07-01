# ADR-004: Generación de PDF como función serverless (Lambda) en vez de servicio siempre activo

**Estado**: Aceptada
**Fecha**: 2026-06-24
**Responsable de la consolidación**: Paquete D (Anthonny)

## Contexto

Renderizar el PDF del reporte requiere abrir una instancia de Chromium headless vía Puppeteer, un proceso que consume una cantidad significativa de CPU y RAM de forma intermitente (solo durante los segundos que dura cada renderizado) y que además necesita las dependencias nativas de un navegador completo instaladas en la imagen. Mantener esto como un microservicio Node.js "siempre encendido" reservaría esos recursos de forma constante aunque no haya reportes en proceso.

## Decisión

La generación de PDF se implementa como una función tipo **AWS Lambda** (Node.js 20 + Puppeteer), empaquetada en una imagen compatible con el runtime de Lambda y expuesta localmente en desarrollo mediante un servidor Express (`app1-worker/lambda-pdf/server.js`) que invoca el mismo handler (`index.js`) que correría en producción sobre AWS Lambda real. En producción/nube, el almacenamiento del PDF resultante es un bucket S3 (emulado localmente con **LocalStack**, servicio `app4-localstack`).

## Consecuencias

**Positivas**:
- Modelo de costos por uso: en un despliegue real a AWS, solo se paga por los segundos de cómputo de cada renderizado, no por un contenedor corriendo 24/7.
- Aislamiento del ciclo de vida de Chromium: cada invocación abre y cierra su propio navegador (`try/finally`), evitando fugas de memoria acumulativas en un proceso de larga duración.
- El Worker OSINT (App1) permanece desacoplado de los detalles de renderizado: solo hace un `POST` con los datos y recibe una URL de PDF.

**Negativas / trade-offs asumidos**:
- *Cold start*: la primera invocación tras un período de inactividad es más lenta al tener que inicializar Chromium.
- Requiere un paso de empaquetado/despliegue adicional específico de Lambda (o, en local, mantener el wrapper Express `server.js` solo para desarrollo) en vez de un simple `docker run` de un servicio HTTP convencional.
- Introduce una dependencia de infraestructura cloud (S3) incluso en desarrollo local, mitigada con LocalStack.
