# ADR-001: Arquitectura Orientada a Eventos (EDA) con RabbitMQ sobre llamadas síncronas

**Estado**: Aceptada
**Fecha**: 2026-06-24
**Responsable de la consolidación**: Paquete D (Anthonny)

## Contexto

El flujo de negocio principal (solicitud de reporte OSINT) requiere consultar 5 APIs gubernamentales externas cuya latencia individual promedio es de 2.5 a 3 segundos, además de renderizar un PDF con Chromium headless. Consultar todo esto de forma síncrona dentro de una única petición HTTP del ciudadano implicaría tiempos de respuesta de 12 a 15 segundos o más, lo cual excede ampliamente los timeouts razonables de un navegador y degrada la experiencia de usuario. Adicionalmente, el sistema está dividido en 4 paquetes de trabajo desarrollados por 4 personas distintas en paralelo, por lo que un acoplamiento síncrono (llamadas HTTP directas entre servicios) obligaría a que todos los servicios estén disponibles simultáneamente para que el sistema funcione, incluso en desarrollo.

## Decisión

Se adopta una Arquitectura Dirigida por Eventos (EDA) con **RabbitMQ** como bus de mensajería central (`net-transit`). Los servicios nunca se invocan directamente entre sí: publican eventos de dominio (`solicitud.osint`, `osint.completado`, `alerta.compliance`, `reporte.listo`) a exchanges de tipo *topic*, y cada consumidor crea su propia cola enlazada mediante *routing key*. El Portal Ciudadano responde al ciudadano con `HTTP 202 Accepted` de inmediato y el ciudadano hace *polling* (o se suscribe por WebSocket) para conocer el resultado final.

## Consecuencias

**Positivas**:
- Los 4 paquetes pueden desarrollarse y desplegarse de forma independiente; cada equipo puede simular (mockear) los eventos de los demás publicando/consumiendo manualmente desde la consola de RabbitMQ.
- Resiliencia: si el Worker OSINT (App1) cae, las solicitudes se acumulan de forma segura en la cola en vez de perderse o fallar inmediatamente.
- Escalado horizontal selectivo: se puede escalar el Worker sin escalar el Portal ni el Compliance Engine.

**Negativas / trade-offs asumidos**:
- Complejidad operativa adicional (un broker más que administrar, monitorear y asegurar).
- Consistencia eventual en vez de consistencia inmediata: el estado del reporte en el Portal tarda en reflejar la finalización del procesamiento.
- Requiere manejo explícito de errores y mensajes "envenenados" (ver `app4-platform/rabbitmq-config/`, exchange `osint.dlx` con colas `solicitud.dlq` y `completado.dlq`).
