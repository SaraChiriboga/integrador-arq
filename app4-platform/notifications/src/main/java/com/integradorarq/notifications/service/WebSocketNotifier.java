package com.integradorarq.notifications.service;

import com.integradorarq.notifications.dto.AlertaComplianceEvent;
import com.integradorarq.notifications.dto.ReporteListoEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketNotifier(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyReportReady(ReporteListoEvent event) {
        messagingTemplate.convertAndSend("/topic/reports/" + event.getRequestId(), event);
    }

    public void notifyComplianceAlert(AlertaComplianceEvent event) {
        messagingTemplate.convertAndSend("/topic/compliance/alerts", event);
    }
}
