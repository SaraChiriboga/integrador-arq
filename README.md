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
| **Paquete D** | `app4-platform/` (Gateway, Notificaciones, ELK, Infra) | *Persona 4* (Por asignar) | NGINX, RabbitMQ, Java 17 (Spring Boot), Docker Compose, ELK Stack |

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
└── app4-platform/              # APP 4 — Infraestructura y Servicios Transversales (Persona 4)
    ├── notifications/          # Servicio de Notificaciones (Spring Boot WebSockets + Mail)
    ├── gateway-config/         # Configuración del proxy reverso (NGINX)
    └── Dockerfile              # Dockerfile del servicio de notificaciones
```

---

## 🚀 Cómo Empezar

1. **Infraestructura Base (Primer Día)**: El **Desarrollador D (Persona 4)** inicializará el `docker-compose.yml` para levantar **RabbitMQ** y **LocalStack (S3)**. Ejecuta `docker-compose up -d` en la raíz para levantar estos servicios de soporte.
2. **Contratos de Eventos**: Consulta la carpeta `docs/event-contracts/` para verificar la estructura exacta de los payloads JSON antes de programar los consumidores o productores en tus respectivos proyectos.
3. **Mocks de Desarrollo**: Cada desarrollador puede implementar un script mock local en su propia carpeta para probar su componente sin esperar el desarrollo final de los demás (consulta las instrucciones detalladas de Mock en el `README.md` de tu respectiva carpeta).
