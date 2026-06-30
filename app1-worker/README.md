# APP 1 — Motor Worker OSINT & Lambda PDF

Este componente está asignado a **Sari (Persona 1)**.

## 📂 Estructura
*   `/worker`: Script/App en Python 3.11 para consumir de RabbitMQ, consultar APIs gubernamentales y guardar en MongoDB.
*   `/lambda-pdf`: Función Node.js + Puppeteer para generar el PDF.
*   `Dockerfile`: Para empaquetar el worker Python.

## 🛠️ Tecnologías a utilizar
*   **Python 3.11** para el Worker (`httpx` para consumo de APIs, `aio-pika` para RabbitMQ, `motor` como cliente asíncrono MongoDB, y `tenacity` para reintentos).
*   **MongoDB 6.0** como almacenamiento crudo.
*   **Node.js 20** + **Puppeteer** para la Lambda de generación de PDF.

## 🚀 Estrategia de Mock en Dev
1.  **APIs de Gobierno**: Para no depender de APIs externas, implementa un servidor local mock (`gov_mock_api.py`) con Flask/FastAPI que responda con latencias aleatorias datos estáticos de cédulas ecuatorianas de prueba.
2.  **Inyección de Solicitudes**: Usa un script CLI `send_test_request.py` que publique un evento `solicitud.osint` directamente en la cola de RabbitMQ para activar el worker, sin necesidad de que el Portal (App 2) esté levantado.
3.  **Localstack**: Puedes interactuar con el bucket de S3 usando `awscli-local` apuntando al endpoint `http://localhost:4566`.
