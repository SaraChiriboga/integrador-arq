# Atributos de Calidad — Concurrencia, Resiliencia y Rate Limiting (App 1)

El motor de extracción (Worker OSINT) de la **App 1** interactúa directamente con sistemas externos de terceros (las 5 APIs gubernamentales mockeadas). Esta sección justifica arquitectónicamente cómo se garantizan el rendimiento, la tolerancia a fallos y la protección de los recursos.

---

## ⚡ 1. Concurrencia Eficiente (Rendimiento y Latencia)

### El Problema:
Consultar de forma secuencial 5 APIs estatales externas cuya latencia promedio individual es de `2.5 a 3 segundos` resultaría en un tiempo total de espera para el ciudadano de **12 a 15 segundos**, lo cual es inaceptable para una experiencia interactiva en la web.

### La Solución Implementada:
El worker utiliza **`asyncio`** y **`httpx.AsyncClient`** en Python 3.11 para despachar las 5 peticiones HTTP GET de forma **concurrente y no bloqueante**.
* **Resultado**: El tiempo total de recolección de datos se reduce al tiempo que tarda el servicio de respuesta más lento (aprox. **3 segundos** en el peor caso). El hilo del sistema operativo no se bloquea en operaciones I/O de red, permitiendo procesar cientos de transacciones con un consumo mínimo de CPU y RAM.

---

## 🛡️ 2. Resiliencia y Tolerancia a Fallos (Disponibilidad)

### El Problema:
Las APIs gubernamentales suelen sufrir caídas transitorias de red, sobrecargas momentáneas de tráfico o reinicios de servidor que arrojan códigos HTTP 502, 503 o 504.

### La Solución Implementada:
Se integró la librería **`tenacity`** mediante decoradores de reintento (`@retry`) para las llamadas externas:
* **Backoff Exponencial con Jitter**: Si una llamada a una API falla, el sistema reintenta la conexión esperando un tiempo que crece exponencialmente (ej: 1s, 2s, 4s...) sumado a un factor de aleatoriedad (*jitter*). Esto evita el efecto de "manada en estampida" (saturar al servidor en su recuperación).
* **Límite de Intentos**: El worker está configurado para realizar un máximo de **3 intentos**. Si la API no se recupera, se registra el fallo, se notifica el estado `FAILED` a través de RabbitMQ y se libera el hilo de ejecución para continuar con otras solicitudes.

---

## 📈 3. Control de Tasa de Peticiones (Rate Limiting y Amortiguamiento)

### El Problema:
Un pico repentino de ciudadanos solicitando reportes (ej: 1,000 peticiones en 5 segundos) saturaría las APIs del gobierno si se reenviaran directamente, provocando el baneo de nuestra IP por sospecha de ataque DDoS.

### La Solución Implementada:
* **Desacoplamiento vía Broker (RabbitMQ)**: El backend no llama directamente al worker. En su lugar, encola las solicitudes en `solicitud.osint.queue`. RabbitMQ actúa como un buffer amortiguador.
* **Prefetch Limit (Control de Flujo)**: El worker Python configura un límite de pre-lectura de mensajes (`prefetch_count`). Esto restringe al worker a consumir únicamente **N mensajes a la vez** por instancia activa. Si el worker está ocupado procesando una extracción de PDF, RabbitMQ retiene el resto de mensajes de forma segura en la cola en lugar de inundar al worker, protegiendo las APIs gubernamentales de picos de tráfico.
