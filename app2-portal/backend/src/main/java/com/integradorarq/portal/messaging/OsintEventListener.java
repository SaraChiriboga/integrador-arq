package com.integradorarq.portal.messaging;

import com.integradorarq.portal.config.RabbitMQConfig;
import com.integradorarq.portal.dto.OsintCompletadoEvent;
import com.integradorarq.portal.dto.ReporteListoEvent;
import com.integradorarq.portal.model.Request;
import com.integradorarq.portal.model.RequestStatus;
import com.integradorarq.portal.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OsintEventListener {

    private final RequestRepository requestRepository;
    private final RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = RabbitMQConfig.OSINT_QUEUE)
    public void onOsintCompletado(OsintCompletadoEvent event) {
        log.info("Recibido evento OSINT completado para requestId: {}", event.getRequestId());

        UUID reqId;
        try {
            reqId = UUID.fromString(event.getRequestId());
        } catch (IllegalArgumentException e) {
            log.warn("El requestId {} no tiene un formato UUID válido", event.getRequestId());
            return;
        }

        Optional<Request> requestOpt = requestRepository.findById(reqId);
        if (requestOpt.isEmpty()) {
            log.warn("No se encontró el Request con ID: {}", event.getRequestId());
            return;
        }

        Request request = requestOpt.get();

        if ("SUCCESS".equalsIgnoreCase(event.getStatus())) {
            request.setStatus(RequestStatus.COMPLETED);
            request.setPdfUrl(event.getPdfUrl());
            request.setCompletedAt(LocalDateTime.now());
            requestRepository.save(request);

            ReporteListoEvent reporteEvent = ReporteListoEvent.builder()
                    .requestId(request.getId().toString())
                    .pdfUrl(request.getPdfUrl())
                    .email(request.getRequesterEmail())
                    .status("COMPLETED")
                    .build();

            rabbitTemplate.convertAndSend(RabbitMQConfig.REPORTE_EXCHANGE, RabbitMQConfig.REPORTE_ROUTING_KEY, reporteEvent);
            log.info("Publicado evento reporte.listo para requestId: {}", request.getId());
        } else if ("FAILED".equalsIgnoreCase(event.getStatus())) {
            request.setStatus(RequestStatus.FAILED);
            request.setCompletedAt(LocalDateTime.now());
            requestRepository.save(request);
            log.error("El proceso OSINT falló para el requestId: {}", request.getId());
        } else {
            log.warn("Estado desconocido recibido en el evento OSINT: {}", event.getStatus());
        }
    }
}
