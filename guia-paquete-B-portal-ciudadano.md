# Guía del Paquete B — Portal Ciudadano

Esta guía explica qué se construyó en el Paquete B, cómo levantarlo y probarlo localmente, y cómo deben integrarse los demás paquetes (A, C, D) con este.

---

## 1. ¿Qué hace este paquete?

El Portal Ciudadano permite que una persona ingrese su cédula y correo, y reciba (de forma asíncrona) un reporte de antecedentes OSINT en PDF. El flujo completo:

1. El ciudadano llena un formulario (React) con cédula y correo.
2. El backend (Spring Boot) valida, evita duplicados con un candado en Redis, guarda la solicitud en PostgreSQL, y publica un evento `solicitud.osint` en RabbitMQ.
3. **(Aquí interviene el Worker de la Persona 1 / Paquete A)** — procesa la solicitud contra las APIs gubernamentales y genera el PDF.
4. Cuando el Worker termina, publica `osint.completado` en RabbitMQ.
5. Nuestro backend escucha ese evento, actualiza el estado a `COMPLETED` en PostgreSQL, y publica `reporte.listo`.
6. **(Aquí interviene el servicio de Notificaciones de la Persona 4 / Paquete D)** — debería escuchar `reporte.listo` y enviar el correo al ciudadano.
7. Mientras tanto, el frontend hace polling cada 3 segundos consultando el estado, y muestra el resultado (con el link de descarga del PDF) en cuanto cambia a `COMPLETED`.

---

## 2. Cómo levantar el Paquete B localmente

### Requisitos
- Docker Desktop corriendo
- JDK 17 (recomendado: Eclipse Temurin o Amazon Corretto — **no** usar JDK 21+, Lombok todavía no es totalmente compatible)
- Node.js 20+
- IntelliJ IDEA (para el backend) y VS Code o similar (para el frontend)

### Paso a paso

1. Clona el repo y muévete a la carpeta raíz `integrador-arq/`.
2. Levanta la infraestructura de este paquete:
   ```
   docker-compose up -d app2-postgres app2-redis app4-rabbitmq
   ```
3. Abre `app2-portal/backend/` en IntelliJ, espera a que indexe Maven, y corre `PortalBackendApplication`.
   - Verifica en la consola que diga `Started PortalBackendApplication` sin errores de conexión.
4. Abre una terminal en `app2-portal/frontend/` y corre:
   ```
   npm install
   npm run dev
   ```
5. Abre `http://localhost:5173` en el navegador — ahí está el formulario.
6. La documentación interactiva de la API (Swagger) está en `http://localhost:8080/swagger-ui.html`.
7. La consola de administración de RabbitMQ está en `http://localhost:15672` (usuario `guest`, contraseña `guest`) — útil para ver colas y publicar mensajes de prueba manualmente.

---

## 3. Cómo probar el flujo completo sin que existan los otros paquetes todavía

Mientras el Worker (Paquete A) y las Notificaciones (Paquete D) no estén listos, puedes simular sus eventos manualmente:

1. Crea una solicitud desde el formulario web. Te va a redirigir a una pantalla de "procesando".
2. Copia el `requestId` de la URL.
3. Ve a RabbitMQ (`localhost:15672`) → **Queues** → `osint.completado.queue` → sección **Publish message**.
4. Pega este payload (reemplazando `requestId` y `targetId` con los tuyos):
   ```json
   {
     "requestId": "TU-REQUEST-ID-AQUI",
     "targetId": "LA-CEDULA-QUE-USASTE",
     "pdfUrl": "https://ejemplo.com/reporte.pdf",
     "status": "SUCCESS",
     "completedAt": 1782880000000,
     "data": {}
   }
   ```
5. Publica el mensaje. La pantalla de estado del navegador debería actualizarse sola en unos segundos, sin refrescar.

---

## 4. Contratos de eventos — cómo deben integrar su parte los demás paquetes

Estos contratos ya están definidos en `docs/event-contracts/` del repo y **no deben cambiarse sin avisar al equipo**, porque romperían la integración de todos.

### Paquete A (Worker OSINT) — Persona responsable: Sari

**Debe consumir** el evento `solicitud.osint` desde la cola `solicitud.osint.queue` (ya existe, la crea el backend de App 2 al arrancar). Formato que va a recibir:
```json
{
  "requestId": "uuid",
  "targetId": "cedula de 10 dígitos",
  "requesterEmail": "correo del ciudadano",
  "timestamp": 1234567890000
}
```

**Debe publicar** el evento `osint.completado` al exchange `osint.exchange` con routing key `osint.completado` (App 2 ya tiene la cola `osint.completado.queue` creada y escuchando ahí). Formato exacto que App 2 espera:
```json
{
  "requestId": "uuid (el mismo que recibió)",
  "targetId": "cedula",
  "pdfUrl": "URL del PDF generado (S3/LocalStack)",
  "status": "SUCCESS o FAILED",
  "completedAt": 1234567890000,
  "data": { "...": "toda la info del ciudadano, App 2 la ignora pero debe venir para cumplir el contrato" }
}
```

### Paquete D (Gateway + Notificaciones) — Persona responsable: por asignar

**Debe consumir** el evento `reporte.listo` que publica App 2. App 2 publica al exchange `reporte.exchange` con routing key `reporte.listo`, pero **no crea la cola** — cada consumidor crea su propia cola y la enlaza a ese exchange (así lo dice el README original). El servicio de Notificaciones debe:
1. Crear su propia cola (ej: `notificaciones.reporte.listo.queue`).
2. Enlazarla al exchange `reporte.exchange` con routing key `reporte.listo`.
3. Consumir mensajes con este formato:
   ```json
   {
     "requestId": "uuid",
     "pdfUrl": "URL del PDF",
     "email": "correo del ciudadano",
     "status": "COMPLETED"
   }
   ```
4. Enviarle un correo al ciudadano con el link del PDF.

También debe configurar el **API Gateway** para enrutar `/api/v1/reports/**` hacia el backend de App 2 (puerto 8080).

### Paquete C (Compliance) — Persona responsable: por asignar

No tiene integración directa obligatoria con App 2 según el plan — consume eventos de App 1 (`osint.completado`, `alerta.compliance`) de forma independiente. No requiere cambios de tu parte.

---

## 5. Cómo se une todo (docker-compose)

Cuando los 4 paquetes tengan su Dockerfile listo, el `docker-compose.yml` de la raíz (mantenido por Persona 4) va a levantar todo junto con un solo comando:
```
docker-compose up -d
```
Cada app corre en su propia red Docker aislada (`net-app1`, `net-app2`, etc.) y solo se comunican entre sí a través de la red compartida `net-transit`, donde vive RabbitMQ. Esto significa que, por ejemplo, el Worker de App 1 nunca se conecta directamente a la base de datos de App 2 — toda la comunicación entre paquetes pasa por eventos de RabbitMQ, nunca por acceso directo a la base de datos de otro equipo. Esa separación es intencional: cada quien es dueño de su propia base de datos.

---

## 6. Estructura de archivos de este paquete

```
app2-portal/
├── README.md                      — resumen general
├── Dockerfile                     — build del backend (Java)
├── backend/
│   ├── docs/schema.sql            — esquema SQL exportado de Postgres
│   └── src/main/java/com/integradorarq/portal/
│       ├── controller/            — endpoints REST
│       ├── service/                — lógica de negocio (idempotencia, orquestación)
│       ├── messaging/              — el listener de RabbitMQ
│       ├── config/                 — RabbitMQ, CORS, Swagger
│       ├── model/                  — entidades JPA (User, Request)
│       ├── repository/             — Spring Data JPA
│       ├── dto/                    — objetos de request/response y eventos
│       └── exception/              — manejo de errores
├── frontend/
│   ├── Dockerfile                  — build del frontend (nginx)
│   └── src/
│       ├── pages/                  — HomePage (formulario), StatusPage (estado)
│       ├── services/                — cliente Axios
│       ├── utils/                   — validador de cédula
│       └── types/                   — interfaces TypeScript
└── docs/c4-diagrams/               — diagrama C4 de componente (.drawio y .png)
```

---

## 7. Glosario rápido de conceptos usados (para repasar)

- **Idempotencia**: evitar que la misma solicitud se procese dos veces. Aquí se logra con un candado temporal en Redis (`lock:reporte:{cedula}`, expira en 10 min).
- **Arquitectura orientada a eventos (EDA)**: los servicios no se llaman directamente entre sí (como una función), sino que publican y escuchan "eventos" a través de un bus de mensajes (RabbitMQ). Esto permite que cada paquete avance de forma independiente sin bloquear a los demás.
- **Exchange, Queue, Binding (RabbitMQ)**: el *exchange* es como una oficina de correos que recibe mensajes; la *queue* es el buzón donde se acumulan hasta que alguien los lee; el *binding* es la regla que dice "estos mensajes con esta etiqueta (routing key) van a este buzón".
- **DTO (Data Transfer Object)**: una clase simple que solo sirve para mover datos entre capas (ej: lo que llega del formulario, o lo que se envía como respuesta), sin lógica de negocio.
- **Polling**: en vez de que el servidor le avise al navegador cuando algo cambió, el navegador pregunta repetidamente ("¿ya está listo? ¿ya está listo?") cada cierto tiempo.
