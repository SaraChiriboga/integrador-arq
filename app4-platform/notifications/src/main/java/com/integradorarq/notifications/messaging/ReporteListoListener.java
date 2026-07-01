package com.integradorarq.notifications.messaging;

import com.integradorarq.notifications.config.RabbitMQConfig;
import com.integradorarq.notifications.dto.ReporteListoEvent;
import com.integradorarq.notifications.service.EmailService;
import com.integradorarq.notifications.service.WebSocketNotifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ReporteListoListener {

    private static final Logger log = LoggerFactory.getLogger(ReporteListoListener.class);

    private final EmailService emailService;
    private final WebSocketNotifier webSocketNotifier;

    public ReporteListoListener(EmailService emailService, WebSocketNotifier webSocketNotifier) {
        this.emailService = emailService;
        this.webSocketNotifier = webSocketNotifier;
    }

    @RabbitListener(queues = RabbitMQConfig.REPORTE_QUEUE)
    public void handleReporteListo(ReporteListoEvent event) {
        log.info("Evento 'reporte.listo' recibido para requestId: {}", event.getRequestId());
        emailService.sendReportReadyEmail(event);
        webSocketNotifier.notifyReportReady(event);
    }
}
