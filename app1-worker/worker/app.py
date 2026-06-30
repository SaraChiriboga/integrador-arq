import asyncio
import logging
import json
from motor.motor_asyncio import AsyncIOMotorClient
import aio_pika

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OSINT_Worker")

# Configuración (En producción leer de variables de entorno)
MONGO_URI = "mongodb://localhost:27017"
RABBITMQ_URI = "amqp://guest:guest@localhost:5672/"
QUEUE_NAME = "solicitud.queue"
EXCHANGE_NAME = "osint.exchange"

async def process_message(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            request_id = payload.get("requestId")
            target_id = payload.get("targetId")
            logger.info(f"Procesando solicitud {request_id} para la cédula {target_id}...")

            # 1. TODO: Consultar APIs de Gobierno de Ecuador (Registro Civil, ANT, SRI, etc.)
            # 2. TODO: Guardar datos agregados en MongoDB
            # 3. TODO: Invocar Lambda PDF
            # 4. TODO: Publicar evento 'osint.completado'
            
            await asyncio.sleep(2) # Simulación de tiempo de extracción
            logger.info(f"Solicitud {request_id} procesada con éxito.")
        except Exception as e:
            logger.error(f"Error procesando mensaje: {e}")

async def main():
    # Conexión MongoDB
    mongo_client = AsyncIOMotorClient(MONGO_URI)
    db = mongo_client["osint_db"]
    logger.info("Conectado a MongoDB con éxito.")

    # Conexión RabbitMQ
    connection = await aio_pika.connect_robust(RABBITMQ_URI)
    channel = await connection.channel()
    
    # Declarar Exchange y Cola
    exchange = await channel.declare_exchange(EXCHANGE_NAME, type=aio_pika.ExchangeType.TOPIC, durable=True)
    queue = await channel.declare_queue(QUEUE_NAME, durable=True)
    await queue.bind(exchange, routing_key="solicitud.osint")

    logger.info("Escuchando mensajes en RabbitMQ...")
    await queue.consume(process_message)

    try:
        await asyncio.Future()  # Correr indefinidamente
    finally:
        await connection.close()

if __name__ == "__main__":
    asyncio.run(main())
