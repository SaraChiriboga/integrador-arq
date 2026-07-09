# Justificaciones de Arquitectura: Costos, Rendimiento y Balanceo

**Aplicacion:** Plataforma OSINT Ecuador — Analisis Completo de Toda la Arquitectura  
**Paquetes:** App1 (Worker OSINT), App2 (Portal), App3 (Compliance), App4 (Plataforma Transversal)  
**Tecnologias Clave:** NGINX, RabbitMQ, Redis, AWS Lambda, AWS S3, PostgreSQL, MongoDB, Elasticsearch, ELK Stack

---

## 1. Costo y Proyeccion — Analisis Real de Infraestructura Completa

> **Metodologia:** Todos los costos se calculan sobre la infraestructura equivalente en **AWS (us-east-1)** utilizando precios publicos de julio 2026. Se proyectan tres escenarios: **desarrollo/piloto**, **produccion minima** (1.000 consultas/dia) y **produccion escalada** (10.000 consultas/dia). Los precios estan en **USD/mes**.

### 1.1 Inventario de Servicios — Mapa Completo

La plataforma OSINT Ecuador contiene los siguientes 19 componentes que generan costos en produccion real:

| # | Componente | Tecnologia Local (Docker) | Equivalente Cloud (AWS) |
|---|---|---|---|
| 1 | API Gateway / Proxy Reverso | NGINX | AWS Application Load Balancer (ALB) |
| 2 | Broker de Mensajeria | RabbitMQ | Amazon MQ (RabbitMQ) |
| 3 | Almacenamiento de Objetos (PDFs) | LocalStack S3 | AWS S3 |
| 4 | Generador de PDF headless | Lambda Node.js / Puppeteer | AWS Lambda |
| 5 | Worker OSINT (Python) | Docker Container | AWS ECS Fargate (app1-worker) |
| 6 | Portal Backend (Spring Boot) | Docker Container | AWS ECS Fargate (app2-backend) |
| 7 | Base de Datos Relacional Portal | PostgreSQL 15 | Amazon RDS PostgreSQL |
| 8 | Cache e Idempotencia | Redis 7 | Amazon ElastiCache (Redis) |
| 9 | Mock APIs Gubernamentales | Docker Container | AWS ECS Fargate (app1-gov-mock) |
| 10 | Compliance Backend (Spring Boot) | Docker Container | AWS ECS Fargate (app3-backend) |
| 11 | Base de Datos Compliance | PostgreSQL 15 | Amazon RDS PostgreSQL |
| 12 | Motor de Busqueda / Indexacion | Elasticsearch 8 | Amazon OpenSearch Service |
| 13 | Servicio de Notificaciones (Spring Boot) | Docker Container | AWS ECS Fargate (app4-notifications) |
| 14 | Frontend Portal Ciudadano (React) | Docker + NGINX | AWS S3 + CloudFront (CDN) |
| 15 | Frontend Compliance Dashboard (React) | Docker + NGINX | AWS S3 + CloudFront (CDN) |
| 16 | Observabilidad — Logstash | Docker Container | AWS ECS Fargate (Logstash) |
| 17 | Observabilidad — Kibana | Docker Container | AWS ECS Fargate (Kibana) |
| 18 | Certificados SSL/TLS | Autofirmados | AWS Certificate Manager (ACM) — Gratuito |
| 19 | Red y Transferencia de Datos | Redes Docker | AWS VPC + Data Transfer |

---

### 1.2 Desglose de Costos por Escenario

#### ESCENARIO A — Piloto / Desarrollo (sin produccion real)
> Entorno de demostracion y pruebas internas. Carga: ~100 consultas/dia. Puede correr en una sola maquina EC2.

| Componente | Servicio AWS | Especificacion | Costo/Mes (USD) |
|---|---|---|---|
| Servidor Principal (todos los contenedores) | EC2 t3.xlarge | 4 vCPU, 16 GB RAM | USD 120.38 |
| Almacenamiento del Servidor | EBS gp3 | 100 GB | USD 8.00 |
| Base de Datos RDS (Portal) | RDS db.t3.micro PostgreSQL | 1 vCPU, 1 GB RAM, 20 GB SSD | USD 14.51 |
| Base de Datos RDS (Compliance) | RDS db.t3.micro PostgreSQL | 1 vCPU, 1 GB RAM, 20 GB SSD | USD 14.51 |
| Almacenamiento PDFs | S3 Standard | 5 GB almacenamiento + transferencia | USD 0.35 |
| Lambda PDF (Puppeteer) | AWS Lambda | ~100 invocaciones/dia x 10s x 512MB | USD 0.00 (free tier) |
| CDN Frontends | CloudFront | 10 GB transferencia | USD 0.85 |
| Transferencia de datos VPC | Data Transfer | Estimado trafico interno | USD 2.00 |
| Certificados SSL | ACM | Ilimitados | USD 0.00 |
| **TOTAL ESCENARIO A** | | | **USD 160.60 /mes** |

> Equivalente anual Escenario A: aprox. **USD 1.927 /anio**

---

#### ESCENARIO B — Produccion Minima (1.000 consultas/dia)
> Operacion institucional real. Servicios redundantes con alta disponibilidad basica (Multi-AZ).  
> Supuestos: 30.000 consultas/mes. Cada consulta genera ~1 MB en MongoDB, ~50 KB de PDF en S3, ~500 KB en Elasticsearch. El Worker Python dura ~10 seg por consulta.

| Componente | Servicio AWS | Especificacion | Costo/Mes (USD) |
|---|---|---|---|
| App 1 — Worker OSINT (Python) | ECS Fargate | 1 vCPU, 2 GB RAM · 2 replicas | USD 58.32 |
| App 1 — Lambda PDF (Puppeteer) | AWS Lambda | 30.000 inv. x 15s x 512MB | USD 3.75 |
| App 1 — MongoDB (documentos brutos) | Amazon DocumentDB | db.t3.medium, 30 GB SSD | USD 90.72 |
| App 1 — Mock APIs Gubernamentales | ECS Fargate | 0.25 vCPU, 0.5 GB RAM | USD 7.29 |
| App 2 — Portal Backend (Spring Boot) | ECS Fargate | 1 vCPU, 2 GB RAM · 2 replicas | USD 58.32 |
| App 2 — PostgreSQL (Portal) | RDS db.t3.small, Multi-AZ | 2 vCPU, 2 GB RAM, 50 GB SSD | USD 54.75 |
| App 2 — Redis (Cache/Idempotencia) | ElastiCache cache.t3.micro | 1 nodo, 0.5 GB RAM | USD 11.52 |
| App 3 — Compliance Backend (Spring Boot) | ECS Fargate | 0.5 vCPU, 1 GB RAM · 1 replica | USD 14.58 |
| App 3 — PostgreSQL (Compliance) | RDS db.t3.small, Multi-AZ | 2 vCPU, 2 GB RAM, 30 GB SSD | USD 50.43 |
| App 3 — Elasticsearch (OpenSearch) | Amazon OpenSearch | t3.small.search, 1 nodo, 50 GB EBS | USD 33.07 |
| App 4 — RabbitMQ (Broker) | Amazon MQ mq.t3.micro | Single-instance | USD 19.37 |
| App 4 — Notifications Backend | ECS Fargate | 0.25 vCPU, 0.5 GB RAM | USD 7.29 |
| App 4 — NGINX / API Gateway | ALB (Application Load Balancer) | 1 ALB, ~30.000 req/mes | USD 16.43 |
| Frontends React (Portal + Dashboard) | S3 + CloudFront CDN | 2 buckets, 50 GB transferencia/mes | USD 5.00 |
| Observabilidad — Logstash | ECS Fargate | 0.5 vCPU, 1 GB RAM | USD 14.58 |
| Observabilidad — Kibana | ECS Fargate | 0.5 vCPU, 1 GB RAM | USD 14.58 |
| Almacenamiento PDFs (S3) | S3 Standard | 30 GB/mes acumulado + 30.000 descargas | USD 2.46 |
| Red y VPC | VPC + Data Transfer | NAT Gateway, transferencia inter-AZ | USD 35.00 |
| Certificados SSL | ACM | Ilimitados | USD 0.00 |
| **TOTAL ESCENARIO B** | | | **USD 497.46 /mes** |

> Equivalente anual Escenario B: aprox. **USD 5.969 /anio**

---

#### ESCENARIO C — Produccion Escalada (10.000 consultas/dia)
> Despliegue a escala nacional. Alta disponibilidad, Multi-AZ, escalabilidad horizontal activa. 300.000 consultas/mes.

| Componente | Servicio AWS | Especificacion | Costo/Mes (USD) |
|---|---|---|---|
| App 1 — Workers OSINT | ECS Fargate + Auto Scaling | 2 vCPU, 4 GB RAM · 5 replicas (prom.) | USD 291.60 |
| App 1 — Lambda PDF | AWS Lambda | 300.000 inv. x 15s x 1024MB | USD 75.00 |
| App 1 — MongoDB (DocumentDB) | Amazon DocumentDB | db.r5.large cluster 3 nodos, 300 GB | USD 712.15 |
| App 1 — Mock APIs Gubernamentales | ECS Fargate | 0.5 vCPU, 1 GB RAM · 2 replicas | USD 29.16 |
| App 2 — Portal Backend | ECS Fargate + Auto Scaling | 2 vCPU, 4 GB RAM · 4 replicas (prom.) | USD 233.28 |
| App 2 — PostgreSQL (Portal) | RDS db.r5.large, Multi-AZ | 2 vCPU, 16 GB RAM, 200 GB SSD | USD 379.16 |
| App 2 — Redis (Cache) | ElastiCache cache.r6g.large | Cluster 2 nodos, 13 GB RAM | USD 203.76 |
| App 3 — Compliance Backend | ECS Fargate + Auto Scaling | 1 vCPU, 2 GB RAM · 3 replicas (prom.) | USD 87.48 |
| App 3 — PostgreSQL (Compliance) | RDS db.r5.large, Multi-AZ | 2 vCPU, 16 GB RAM, 100 GB SSD | USD 357.46 |
| App 3 — OpenSearch (Elasticsearch) | Amazon OpenSearch | m5.large.search, 3 nodos, 500 GB EBS | USD 550.21 |
| App 4 — RabbitMQ | Amazon MQ mq.m5.large, Multi-AZ | Alta disponibilidad activa/standby | USD 261.48 |
| App 4 — Notifications | ECS Fargate | 1 vCPU, 2 GB RAM · 2 replicas | USD 58.32 |
| App 4 — NGINX / ALB | ALB + WAF | 1 ALB con AWS WAF (firewall web) | USD 52.00 |
| Frontends React | S3 + CloudFront CDN | 200 GB transferencia/mes | USD 18.60 |
| Observabilidad — ELK Stack | ECS Fargate (Logstash + Kibana) | 2 vCPU, 4 GB RAM total | USD 58.32 |
| Almacenamiento PDFs (S3) | S3 Standard | 300 GB acumulado + 300.000 descargas | USD 24.60 |
| Red y VPC | VPC + NAT + Data Transfer | NAT Gateway + trafico inter-AZ intensivo | USD 180.00 |
| Certificados SSL | ACM | Ilimitados | USD 0.00 |
| Soporte AWS (Business) | AWS Support | Recomendado para produccion gubernamental | USD 100.00 |
| **TOTAL ESCENARIO C** | | | **USD 3.672 /mes** |

> Equivalente anual Escenario C: aprox. **USD 44.064 /anio**

---

### 1.3 Resumen Comparativo

| Escenario | Consultas/Dia | Costo Mensual | Costo Anual | Costo por Consulta |
|---|---|---|---|---|
| A — Piloto | 100 | USD 161 | USD 1.927 | USD 0.054 por consulta |
| B — Produccion Minima | 1.000 | USD 497 | USD 5.969 | USD 0.017 por consulta |
| C — Produccion Escalada | 10.000 | USD 3.672 | USD 44.064 | USD 0.012 por consulta |

> Economia de escala: A mayor volumen de consultas, el costo por unidad baja un 78% al pasar del escenario piloto al escalado, gracias al uso de Fargate (pago por uso) y Lambda (pago por invocacion).

---

### 1.4 Analisis de Ahorro por Decisiones Arquitectonicas

#### Ahorro 1 — Lambda vs. Servidor Dedicado para PDF

El generador de PDF (Chromium Headless con Puppeteer) genera picos extremos de CPU/RAM de ~10 segundos y luego queda totalmente inactivo. Esta capacidad ociosa del 90% del tiempo hace que un servidor dedicado sea irrentable.

| Alternativa | Especificacion | Costo Mensual (Escenario B) |
|---|---|---|
| Servidor Dedicado EC2 c5.large | 2 vCPU, 4 GB RAM — encendido 24/7 | USD 61.20 /mes |
| AWS Lambda — arquitectura actual | Factura solo por uso real (30.000 x 15s) | USD 3.75 /mes |
| **Ahorro mensual** | | **USD 57.45 = 94% de reduccion** |

#### Ahorro 2 — Arquitectura Asincrona vs. Sincrona

Al usar RabbitMQ para desacoplar el procesamiento, el Portal Backend responde en menos de 200ms y no necesita mantener hilos HTTP abiertos durante los 10-15 segundos que tarda la extraccion OSINT. Esto reduce la necesidad de replicas del backend:

| Alternativa | Replicas Necesarias (Escenario B) | Costo ECS Fargate/mes |
|---|---|---|
| Arquitectura Sincrona (HTTP directo) | 8 replicas para absorber la concurrencia | USD 233.28 |
| Arquitectura Asincrona EDA (actual) | 2 replicas (conexion rapida 202ms) | USD 58.32 |
| **Ahorro mensual** | | **USD 174.96 = 75% de reduccion** |

#### Ahorro 3 — Redis para Idempotencia (evita re-procesamiento)

Sin el lock de Redis (lock:reporte:{cedula}), los dobles-clics del usuario generarian consultas duplicadas a las APIs gubernamentales, PDFs redundantes y costo extra en Lambda:

| Escenario | Tasa Duplicados Estimada | Costo extra Lambda + Worker/mes |
|---|---|---|
| Sin Redis Lock | ~5% de consultas duplicadas | +USD 3.75 en Lambda + carga extra en Worker |
| Con Redis Lock (actual) | 0% duplicados procesados | USD 0 adicional |

---

### 1.5 Proyeccion Financiera a 3 Anos (Escenario B -> C)

Asumiendo crecimiento gradual desde produccion minima (Ano 1) hasta escalada completa (Ano 3):

| Ano | Consultas/Dia Promedio | Costo Mensual Estimado | Costo Anual |
|---|---|---|---|
| Ano 1 | 1.000 -> 3.000 consultas/dia | USD 497 -> USD 1.100 | aprox. USD 9.564 |
| Ano 2 | 3.000 -> 7.000 consultas/dia | USD 1.100 -> USD 2.400 | aprox. USD 21.000 |
| Ano 3 | 7.000 -> 10.000 consultas/dia | USD 2.400 -> USD 3.672 | aprox. USD 36.864 |
| **Total 3 Anos** | | | **aprox. USD 67.428** |

> Con Reserved Instances en RDS y Savings Plans en Fargate (compromiso a 1 ano), se puede reducir el costo total en un 30-40%, llevando los 3 anos a aproximadamente **USD 40.000 - USD 47.000**.

---

## 2. Balanceo de Carga (Load Balancing)

El balanceo de carga se implementa en dos capas distintas del ecosistema:

`mermaid
graph TD
    Client((Ciudadano)) -->|HTTPS| GW[API Gateway: NGINX / ALB]
    
    subgraph Balanceo HTTP
        GW -->|Round-Robin| App2_1[app2-backend: Replica 1]
        GW -->|Round-Robin| App2_2[app2-backend: Replica 2]
    end
    
    App2_1 -->|Publicar Evento| MQ[RabbitMQ]
    App2_2 -->|Publicar Evento| MQ
    
    subgraph Balanceo por Competencia de Eventos
        MQ -->|Prefetch limitado| Worker1[app1-worker: Instancia 1]
        MQ -->|Prefetch limitado| Worker2[app1-worker: Instancia 2]
    end
`

### A. Balanceo de Carga Perimetral (Capa HTTP)
- **Implementacion:** NGINX (pp4-gateway) actua como balanceador Round-Robin primario. Distribuye de forma equitativa las peticiones HTTP entrantes del Portal y del Dashboard hacia las replicas internas del Backend de Solicitudes (App 2) y de Compliance (App 3).

### B. Balanceo por Competencia de Consumidores (Capa Asincrona)
- **Implementacion:** A nivel de procesamiento de eventos, RabbitMQ actua como balanceador elastico natural. Si la carga de solicitudes aumenta, se pueden instanciar multiples contenedores de pp1-worker sin reconfigurar la red.
- *Mecanismo:* RabbitMQ reparte las tareas de solicitud.queue a los workers libres mediante politicas de prefetch limitado (asic.qos = 1), evitando que un worker sature de llamadas concurrentes a los servidores gubernamentales simulados.

---

## 3. Performance y Escalabilidad

La latencia combinada para consultar las 5 APIs gubernamentales de Ecuador oscila entre 5 y 15 segundos. Mantener un canal HTTP sincrono abierto durante ese tiempo bloquearia los hilos del servidor web.

- **Coreografia Asincrona (Tolerancia a Latencia):** El Portal responde en **menos de 200 milisegundos** con un codigo de estado 202 Accepted y libera la conexion. El procesamiento se delega al bus RabbitMQ, aislando por completo la latencia pesada en los workers de background.
- **Cache en Redis (Escalabilidad de Lectura):** Empleando el patron **Cache-Aside**, las solicitudes finalizadas se sirven directamente desde MongoDB y la duplicidad concurrente de claves se gestiona en memoria con Redis (lock:reporte:{cedula} con TTL de 10 min). Esto elimina la latencia de red de las bases de datos transaccionales de PostgreSQL.
- **Escalabilidad Horizontal Selectiva:** Si hay picos de usuarios, se escala horizontalmente la App 2 y la App 1 de forma independiente, dejando el motor de Compliance (App 3) operando con recursos estables sin gastar presupuesto innecesario.
