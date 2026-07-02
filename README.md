# Plataforma OSINT Ecuador — Arquitectura EDA Desacoplada (v3)

Este es el repositorio unificado de la **Plataforma OSINT Ecuador (v3)**. El sistema está estructurado mediante una Arquitectura Dirigida por Eventos (EDA) que conecta 3 aplicaciones independientes a través de un bus de mensajes (RabbitMQ) y un API Gateway.

---

## 👥 Asignación de Roles y Reparto de Trabajo

De acuerdo con el plan consensuado, cada desarrollador es responsable de un paquete de trabajo desacoplado:

| Paquete | Componente | Desarrollador Responsable | Tecnologías Clave |
| :--- | :--- | :--- | :--- |
| **Paquete A** | `app1-worker/` (Worker OSINT + Lambda PDF) | **Sari** (Tú) | Python 3.11, MongoDB, Node.js + Puppeteer |
| **Paquete B** | `app2-portal/` (Portal Ciudadano SPA + Backend) | **Samu** | Java 17 (Spring Boot 3.x), React, PostgreSQL, Redis |
| **Paquete C** | `app3-compliance/` (Dashboard Monitor Compliance) | *Persona 3* (Por asignar) | Java 17 (Spring Boot 3.x), React, PostgreSQL, Elasticsearch |
| **Paquete D** | `app4-platform/` (Gateway, Notificaciones, ELK, Infra) | **Anthonny** | NGINX, RabbitMQ, Java 17 (Spring Boot), Docker Compose, ELK Stack |

---

## 📂 Estructura de Directorios del Repositorio

Para que todo el equipo pueda trabajar en paralelo sin colisionar en ramas de Git, mantendremos la siguiente jerarquía:

```text
osint-ecuador/
├── docker-compose.yml          # Orquestador local multi-red (mantenido por Persona 4)
├── README.md                   # Esta guía general
├── docs/                       # Documentación compartida
│   ├── c4-diagrams/            # Modelado de arquitectura C4 (Icepanel / diagramas png)
│   ├── event-contracts/        # Contratos JSON de los eventos RabbitMQ que todos consultan
│   └── architecture-decisions/ # Registro de Decisiones de Arquitectura (ADR)
├── app1-worker/                # APP 1 — Motor Worker OSINT (SARI)
│   ├── worker/                 # Código del Worker extractor en Python
│   ├── lambda-pdf/             # Código de la función generadora de PDF (Node.js + Puppeteer)
│   └── Dockerfile              # Dockerfile para el Worker
├── app2-portal/                # APP 2 — Portal Ciudadano (SAMU)
│   ├── backend/                # Backend Spring Boot (se abre en IntelliJ)
│   ├── frontend/               # Frontend React SPA (se abre en VS Code)
│   └── Dockerfile              # Dockerfile de la API
├── app3-compliance/            # APP 3 — Dashboard Monitor Compliance (Persona 3)
│   ├── backend/                # Backend Spring Boot
│   ├── frontend/               # Dashboard React SPA
│   └── Dockerfile
└── app4-platform/              # APP 4 — Infraestructura y Servicios Transversales (Anthonny)
    ├── notifications/          # Servicio de Notificaciones (Spring Boot WebSockets + Mail)
    ├── gateway-config/         # Configuración del proxy reverso (NGINX)
    ├── rabbitmq-config/        # Topología declarativa de RabbitMQ (exchanges, DLX/DLQ, policies)
    ├── elk-config/             # Pipeline de Logstash
    ├── Dockerfile              # Dockerfile del servicio de notificaciones
    └── gateway.Dockerfile      # Dockerfile del API Gateway (NGINX + TLS autofirmado)
```

---

## 🚀 Cómo Empezar

1. **Contratos de Eventos**: Consulta la carpeta `docs/event-contracts/` para verificar la estructura exacta de los payloads JSON antes de programar los consumidores o productores en tus respectivos proyectos.
2. **Mocks de Desarrollo**: Cada desarrollador puede implementar un script mock local en su propia carpeta para probar su componente sin esperar el desarrollo final de los demás (consulta las instrucciones detalladas de Mock en el `README.md` de tu respectiva carpeta).
3. **Levantar todo el ecosistema integrado**: desde la raíz del repositorio,
   ```bash
   docker-compose up -d
   ```
   Esto levanta los 4 paquetes completos (frontends, backends, workers, bases de datos, RabbitMQ, Gateway y Notificaciones) respetando el aislamiento de red descrito en `docs/infrastructure/topologia-red-docker.drawio`.
   - Portal Ciudadano: http://localhost:5173
   - Dashboard Compliance: http://localhost:5174
   - API Gateway (TLS autofirmado): https://localhost
   - RabbitMQ Management: http://localhost:15672 (guest/guest)
   - Envío de correos: real, disparado por el navegador del ciudadano vía EmailJS al completarse el reporte (ver `docs/architecture-decisions/ADR-005-emailjs-frontend.md`).
4. **Observabilidad (opcional)**: el stack ELK está apagado por defecto para no sobrecargar de RAM el equipo de desarrollo. Para activarlo:
   ```bash
   docker-compose --profile elk up -d
   ```
   Kibana queda disponible en http://localhost:5601.

## 📐 Documentación de Arquitectura

- `docs/c4-diagrams/`: diagramas C4 de Contexto y Contenedores (nivel sistema) y de Componente (por paquete).
- `docs/infrastructure/topologia-red-docker.drawio`: diagrama de despliegue con las 4 redes Docker aisladas.
- `docs/architecture-decisions/`: ADRs (Registro de Decisiones de Arquitectura) del sistema.
- `docs/quality-attributes/`: justificación de los atributos de calidad por paquete (caché, rate limiting, indexación, seguridad/redundancia).
- `docs/event-contracts/`: contratos JSON de los eventos que fluyen por RabbitMQ.
