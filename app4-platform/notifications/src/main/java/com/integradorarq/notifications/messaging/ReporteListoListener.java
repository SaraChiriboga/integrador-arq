package com.integradorarq.notifications.messaging;

import com.integradorarq.notifications.config.RabbitMQConfig;
import com.integradorarq.notifications.dto.ReporteListoEvent;
import com.integradorarq.notifications.service.WebSocketNotifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * El envío del correo de "reporte listo" ya no ocurre aquí: lo dispara el
 * frontend (App2) directamente vía EmailJS al detectar el estado COMPLETED,
 * para no depender de credenciales SMTP compartidas por el equipo. Este
 * listener solo se encarga del push en tiempo real por WebSocket.
 */
@Component
public class ReporteListoListener {

    private static final Logger log = LoggerFactory.getLogger(ReporteListoListener.class);

    private final WebSocketNotifier webSocketNotifier;

    public ReporteListoListener(WebSocketNotifier webSocketNotifier) {
        this.webSocketNotifier = webSocketNotifier;
    }

    @RabbitListener(queues = RabbitMQConfig.REPORTE_QUEUE)
    public void handleReporteListo(ReporteListoEvent event) {
        log.info("Evento 'reporte.listo' recibido para requestId: {}", event.getRequestId());
        webSocketNotifier.notifyReportReady(event);
    }
}
