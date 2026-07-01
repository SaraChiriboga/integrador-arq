package com.integradorarq.notifications.service;

import com.integradorarq.notifications.dto.ReporteListoEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${notifications.mail.from:no-reply@osint-ecuador.local}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendReportReadyEmail(ReporteListoEvent event) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(event.getEmail());
        message.setSubject("Tu reporte OSINT está listo");
        message.setText(
                "Hola,\n\n" +
                        "Tu solicitud de reporte (" + event.getRequestId() + ") ha finalizado con éxito.\n" +
                        "Puedes descargarlo aquí: " + event.getPdfUrl() + "\n\n" +
                        "Plataforma OSINT Ecuador."
        );

        try {
            mailSender.send(message);
            log.info("Correo de reporte listo enviado a {} (requestId: {})", event.getEmail(), event.getRequestId());
        } catch (Exception e) {
            log.error("Error enviando correo para requestId {}: {}", event.getRequestId(), e.getMessage());
        }
    }
}
