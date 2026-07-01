package com.integradorarq.notifications.messaging;

import com.integradorarq.notifications.config.RabbitMQConfig;
import com.integradorarq.notifications.dto.AlertaComplianceEvent;
import com.integradorarq.notifications.service.WebSocketNotifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class AlertaComplianceListener {

    private static final Logger log = LoggerFactory.getLogger(AlertaComplianceListener.class);

    private final WebSocketNotifier webSocketNotifier;

    public AlertaComplianceListener(WebSocketNotifier webSocketNotifier) {
        this.webSocketNotifier = webSocketNotifier;
    }

    @RabbitListener(queues = RabbitMQConfig.ALERTA_QUEUE)
    public void handleAlertaCompliance(AlertaComplianceEvent event) {
        log.info("Evento 'alerta.compliance' recibido para alertId: {} (riesgo: {})", event.getAlertId(), event.getRiskLevel());
        webSocketNotifier.notifyComplianceAlert(event);
    }
}
