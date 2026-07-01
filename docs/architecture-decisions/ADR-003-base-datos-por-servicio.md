# ADR-003: Base de datos por servicio (sin acceso cruzado)

**Estado**: Aceptada
**Fecha**: 2026-06-24
**Responsable de la consolidación**: Paquete D (Anthonny)

## Contexto

El sistema combina 4 tipos de datos con necesidades muy distintas: datos crudos sin esquema extraídos de fuentes gubernamentales (App1), datos transaccionales de solicitudes y usuarios (App2), índices de búsqueda de texto completo y alertas de cumplimiento (App3), y estado efímero de notificaciones (App4, sin persistencia propia). Compartir una única base de datos entre los 4 paquetes crearía acoplamiento fuerte entre equipos que desarrollan en paralelo y un punto único de fallo (SPOF) para todo el sistema.

## Decisión

Cada aplicación es dueña exclusiva de su propia base de datos, en su propia red Docker aislada, y **nadie accede a la base de datos de otra aplicación directamente** — toda comunicación entre paquetes ocurre exclusivamente vía eventos de RabbitMQ (ver ADR-001):
- App1 (Worker OSINT): **MongoDB** (`osint_db`, colección `osint_raw_data`) — sin esquema, apto para JSON crudo heterogéneo de 5 fuentes distintas.
- App2 (Portal Ciudadano): **PostgreSQL** (`portal_db`, tablas `requests`/`users`) + **Redis** (candado de idempotencia `lock:reporte:{cedula}`, TTL 10 min).
- App3 (Compliance Engine): **PostgreSQL** (`compliance_db`, alertas y auditoría) + **Elasticsearch** (índice de búsqueda de texto completo con analizador en español).
- App4 (Notificaciones): sin base de datos propia — es *stateless*, reacciona a eventos y reenvía (email/WebSocket).

## Consecuencias

**Positivas**:
- Elimina el SPOF de datos: una caída de `app2-postgres` no afecta la disponibilidad de `app3-elasticsearch` ni de `app1-mongodb`.
- Cada equipo elige el motor más adecuado a su carga de trabajo (documento vs. relacional vs. índice invertido) sin negociar un esquema común.
- Refuerza el aislamiento de red: cada base de datos vive únicamente en la red Docker de su aplicación (`net-app1`, `net-app2`, `net-app3`), nunca en `net-transit`.

**Negativas / trade-offs asumidos**:
- No hay integridad referencial ni transacciones distribuidas entre los datos de las 4 apps; la consistencia entre ellas es eventual y se reconstruye leyendo los eventos (p.ej. App3 vuelve a guardar `fullName`/`targetId` en su propio Postgres/Elasticsearch en vez de referenciar la fila de App2).
- Reportes analíticos que crucen datos de más de una app requieren federar consultas a nivel de aplicación (o un futuro data warehouse), no un `JOIN` SQL directo.
