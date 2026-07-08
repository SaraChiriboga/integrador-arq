# Guía de Modelado C4: Diagrama de Componentes (Nivel 3) - App 3 (Compliance Engine)

**Paquete Asociado:** Paquete C (Dashboard y Compliance)  
**Propósito:** Dado que estás construyendo los diagramas lógicos en **IcePanel**, esta guía te detalla el mapa exacto de **cajas (Components)**, **relaciones (Connections)** y **flujos** que debes dibujar en tu espacio de trabajo de IcePanel para la **App 3 (Compliance Backend)**.

---

## 1. Límites del Contenedor (Container Boundary)
El diagrama se enfoca en lo que ocurre **dentro** de la caja de la **API de Compliance (Spring Boot)**. 

### Elementos Externos a Conectar (Fuera del Contenedor):
*   `RabbitMQ (Bus de Eventos)`
*   `PostgreSQL (Base de Datos App 3)`
*   `Elasticsearch (Clúster de Búsqueda)`
*   `OpenSanctions API (API Cloud Externa)`
*   `API Gateway (NGINX)`

---

## 2. Componentes Internos a Dibujar en IcePanel (Cajas)

Dibuja los siguientes **8 componentes** dentro del contenedor de la App 3:

1.  **`ComplianceEventListener` (Consumer de RabbitMQ):**
    *   *Descripción:* Listener que escucha la cola `compliance.osint.completado.queue`. Recibe y deserializa el evento `osint.completado`.
2.  **`ComplianceService` (Gestor de Reglas de Negocio):**
    *   *Descripción:* Componente central que coordina el flujo de cumplimiento: inicia el cruce, evalúa el score y decide si crear alertas e indexar.
3.  **`OpenSanctionsClient` (Cliente Web HTTP):**
    *   *Descripción:* Utiliza Spring WebClient para realizar llamadas no bloqueantes hacia la API de OpenSanctions.
4.  **`SearchService` (Indexador y Consultor de Elasticsearch):**
    *   *Descripción:* Servicio encargado de formatear e indexar reportes usando Spring Data Elasticsearch.
5.  **`AlertRepository` (Acceso a Postgres):**
    *   *Descripción:* Repositorio JPA para persistir y listar alertas en la base de datos relacional.
6.  **`EventPublisher` (Producer de RabbitMQ):**
    *   *Descripción:* Publicador de eventos que envía `alerta.compliance` al bus cuando se supera el score del 80%.
7.  **`SearchController` (Controlador REST de Búsquedas):**
    *   *Descripción:* Endpoint REST (`GET /search?q=`) que recibe consultas desde el Dashboard y las delega al buscador.
8.  **`AlertController` (Controlador REST de Alertas):**
    *   *Descripción:* Endpoint REST (`GET /alerts`) que expone el feed de alertas de alto riesgo para los analistas.

---

## 3. Relaciones y Conexiones a Trazar (Flechas)

Conecta las cajas en IcePanel siguiendo este flujo de datos:

### Flujo A: Consumo de Eventos y Evaluación (Entrada Asíncrona)
*   `RabbitMQ` ➔ **conecta con** ➔ `ComplianceEventListener` *(Etiqueta: "Consume evento osint.completado")*
*   `ComplianceEventListener` ➔ **invoca a** ➔ `ComplianceService` *(Etiqueta: "Envía datos del reporte")*
*   `ComplianceService` ➔ **invoca a** ➔ `OpenSanctionsClient` *(Etiqueta: "Solicita validación PEP")*
*   `OpenSanctionsClient` ➔ **hace llamada HTTP a** ➔ `OpenSanctions API` *(Etiqueta: "POST /match")*
*   `ComplianceService` ➔ **invoca a** ➔ `SearchService` *(Etiqueta: "Indexa metadatos de reporte")*
*   `SearchService` ➔ **escribe datos en** ➔ `Elasticsearch` *(Etiqueta: "Indexa en reports index")*

### Flujo B: Generación de Alertas (Si el Match es > 80%)
*   `ComplianceService` ➔ **invoca a** ➔ `AlertRepository` *(Etiqueta: "Guarda alerta PENDING")*
*   `AlertRepository` ➔ **escribe en** ➔ `PostgreSQL (DB App 3)` *(Etiqueta: "Persiste en tabla alerts")*
*   `ComplianceService` ➔ **invoca a** ➔ `EventPublisher` *(Etiqueta: "Solicita emitir alerta")*
*   `EventPublisher` ➔ **publica en** ➔ `RabbitMQ` *(Etiqueta: "Emite evento alerta.compliance")*

### Flujo C: Consultas del Analista (Dashboard Web)
*   `API Gateway (NGINX)` ➔ **redirige a** ➔ `SearchController` *(Etiqueta: "GET /api/v1/compliance/search")*
*   `SearchController` ➔ **invoca a** ➔ `SearchService` *(Etiqueta: "Ejecuta consulta difusa")*
*   `SearchService` ➔ **consulta a** ➔ `Elasticsearch` *(Etiqueta: "Busca en reports index")*
*   `API Gateway (NGINX)` ➔ **redirige a** ➔ `AlertController` *(Etiqueta: "GET /api/v1/compliance/alerts")*
*   `AlertController` ➔ **invoca a** ➔ `AlertRepository` *(Etiqueta: "Recupera alertas")*
