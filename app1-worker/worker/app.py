import asyncio
import logging
import json
import os
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
import aio_pika
from tenacity import retry, stop_after_attempt, wait_exponential

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OSINT_Worker")

# variables de entorno con fallbacks para desarrollo local
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://admin:UDLA@clusterudla01.3scysxe.mongodb.net/")
RABBITMQ_URI = os.getenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")
GOV_API_BASE = os.getenv("GOV_API_BASE", "http://localhost:8083")
LAMBDA_PDF_URL = os.getenv("LAMBDA_PDF_URL", "http://localhost:3000")

QUEUE_NAME = "solicitud.osint.queue"
EXCHANGE_NAME = "osint.exchange"

# Instancia de clientes reutilizables
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client["osint_db"]
raw_collection = db["osint_raw_data"]

async def fetch_gov_data(client: httpx.AsyncClient, entity: str, target_id: str):
    """Realiza una consulta a un API gubernamental específica con reintentos."""
    url = f"{GOV_API_BASE}/{entity}/{target_id}"
    try:
        response = await client.get(url, timeout=5.0)
        if response.status_code == 200:
            return response.json()
        logger.warning(f"Entidad {entity} retornó código {response.status_code} para {target_id}")
    except Exception as e:
        logger.error(f"Error consultando entidad {entity} para {target_id}: {e}")
    return None

async def call_pdf_lambda(request_id: str, data: dict):
    """Llama a la Lambda local para renderizar y subir el PDF."""
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "requestId": request_id,
                "data": data
            }
            logger.info(f"Invocando Lambda de generación PDF para la solicitud {request_id}...")
            response = await client.post(LAMBDA_PDF_URL, json=payload, timeout=15.0)
            if response.status_code == 200:
                result = response.json()
                # Localstack retorna la URL de S3 en la respuesta de la Lambda
                return result.get("pdfUrl")
            logger.error(f"Lambda PDF retornó error {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error invocando Lambda PDF: {e}")
    return None

async def process_message(message: aio_pika.IncomingMessage, channel: aio_pika.Channel):
    """Procesamiento principal asíncrono de solicitudes OSINT."""
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            request_id = payload.get("requestId")
            target_id = payload.get("targetId")
            
            if not request_id or not target_id:
                logger.error("Mensaje inválido. Faltan requestId o targetId.")
                return

            logger.info(f"--- NUEVA SOLICITUD RECIBIDA: {request_id} (Cédula: {target_id}) ---")

            # 1. Consultar de forma paralela las 5 APIs
            async with httpx.AsyncClient() as client:
                tasks = {
                    "rc": fetch_gov_data(client, "rc", target_id),
                    "ant": fetch_gov_data(client, "ant", target_id),
                    "senescyt": fetch_gov_data(client, "senescyt", target_id),
                    "sri": fetch_gov_data(client, "sri", target_id),
                    "iess": fetch_gov_data(client, "iess", target_id)
                }
                
                results = await asyncio.gather(*tasks.values())
                extracted_data = dict(zip(tasks.keys(), results))

            # Verificar si logramos obtener al menos la identidad (Registro Civil)
            if not extracted_data.get("rc"):
                logger.error(f"No se pudo extraer la información básica del Registro Civil para {target_id}. Abortando.")
                # Publicar evento fallido
                await publish_completion_event(channel, request_id, target_id, "", "FAILED", {})
                return

            # Formatear la data consolidada para guardar
            consolidated = {
                "fullName": extracted_data["rc"].get("fullName"),
                "birthDate": extracted_data["rc"].get("birthDate"),
                "civilStatus": extracted_data["rc"].get("civilStatus"),
                "ant": extracted_data["ant"] or {"points": 30, "fines": 0.0},
                "senescyt": extracted_data["senescyt"] or [],
                "sri": extracted_data["sri"] or {"hasRuc": False, "taxStatus": "AL DIA"},
                "iess": extracted_data["iess"] or {"isAffiliated": False, "contributions": 0}
            }

            # 2. Guardar datos crudos en MongoDB (Persistencia aislada App 1)
            document = {
                "requestId": request_id,
                "targetId": target_id,
                "extractedData": extracted_data,
                "timestamp": asyncio.get_event_loop().time()
            }
            await raw_collection.insert_one(document)
            logger.info("Datos agregados guardados en MongoDB.")

            # 3. Invocar Lambda PDF
            pdf_url = await call_pdf_lambda(request_id, consolidated)
            
            if pdf_url:
                logger.info(f"PDF generado y subido con éxito: {pdf_url}")
                # 4. Publicar evento de finalización exitosa
                await publish_completion_event(channel, request_id, target_id, pdf_url, "SUCCESS", consolidated)
            else:
                logger.error("No se pudo obtener la URL del PDF.")
                await publish_completion_event(channel, request_id, target_id, "", "FAILED", {})

        except Exception as e:
            logger.error(f"Error crítico procesando mensaje: {e}")

async def publish_completion_event(channel: aio_pika.Channel, request_id: str, target_id: str, pdf_url: str, status: str, data: dict):
    """Publica el evento osint.completado al exchange de RabbitMQ."""
    event = {
        "requestId": request_id,
        "targetId": target_id,
        "pdfUrl": pdf_url,
        "status": status,
        "completedAt": int(asyncio.get_event_loop().time() * 1000),
        "data": data
    }
    
    body = json.dumps(event).encode('utf-8')
    exchange = await channel.get_exchange(EXCHANGE_NAME)
    
    await exchange.publish(
        aio_pika.Message(
            body=body,
            content_type="application/json"
        ),
        routing_key="osint.completado"
    )
    logger.info(f"Evento 'osint.completado' publicado con estado: {status}")

async def main():
    # Conectar a RabbitMQ con reintento automático
    logger.info(f"Conectando a RabbitMQ en: {RABBITMQ_URI}")
    connection = await aio_pika.connect_robust(RABBITMQ_URI)
    channel = await connection.channel()
    
    # Declarar Exchange
    exchange = await channel.declare_exchange(EXCHANGE_NAME, type=aio_pika.ExchangeType.TOPIC, durable=True)
    
    # Declarar la cola (App 2 ya la debería crear, pero lo hacemos por seguridad/independencia)
    queue = await channel.declare_queue(QUEUE_NAME, durable=True)
    await queue.bind(exchange, routing_key="solicitud.osint")

    logger.info(f"Worker listo y escuchando la cola {QUEUE_NAME}...")
    await queue.consume(lambda msg: process_message(msg, channel))

    try:
        await asyncio.Future()  # Bloquear hilo para mantener el worker activo
    finally:
        await connection.close()

if __name__ == "__main__":
    asyncio.run(main())
