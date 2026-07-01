# Atributos de Calidad — Estrategia de Caché e Idempotencia (App 2)

El portal de cara al ciudadano de la **App 2** implementa un control estricto de concurrencia e idempotencia utilizando Redis para evitar solicitudes duplicadas en procesamiento paralelo.

---

## 🔒 1. Candado de Idempotencia (`lock:reporte:{cedula}`)

Para evitar que un ciudadano haga múltiples clics rápidos en el formulario o que un bot inunde el backend con solicitudes simultáneas para el mismo número de cédula, el backend en Java Spring Boot implementa un candado distribuido de idempotencia en Redis.

### Clave de Redis:
`lock:reporte:{cedula}`

---

## ⏳ 2. Justificación del TTL de Redis (10 minutos)

El candado de bloqueo utiliza un **TTL (Time To Live) de 10 minutos** por las siguientes razones de diseño y experiencia de usuario:

1. **Tiempo de Procesamiento de Carga del Worker OSINT**:
   El Worker OSINT (App 1) realiza llamadas externas a las 5 APIs del gobierno y renderiza un PDF mediante Puppeteer. En casos de tráfico pesado, latencia de red estatal o reintentos con *backoff exponencial* por caídas temporales de las APIs gubernamentales, el procesamiento puede demorar de varios segundos a minutos. Un TTL de 10 minutos garantiza que el candado cubra de forma segura el ciclo de vida completo de la solicitud sin expirar prematuramente en el peor de los casos.

2. **Balance con la Experiencia del Usuario**:
   Si una solicitud llega a fallar definitivamente (por ejemplo, porque todas las APIs de gobierno están fuera de línea o porque falló la base de datos), el candado expira automáticamente en 10 minutos. Esto evita penalizar innecesariamente al usuario, permitiéndole volver a intentar su consulta sin necesidad de intervención manual de un administrador para liberar el bloqueo.

3. **Configurabilidad**:
   Este valor está expuesto en las propiedades del entorno de Spring Boot, lo que permite ajustarlo dinámicamente si en producción se detecta que los tiempos reales de procesamiento son menores o mayores.
