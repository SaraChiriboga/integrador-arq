package com.integradorarq.compliance.service;

import com.integradorarq.compliance.config.RabbitMQConfig;
import com.integradorarq.compliance.dto.AlertaComplianceEvent;
import com.integradorarq.compliance.dto.OsintCompletadoEvent;
import com.integradorarq.compliance.model.Alert;
import com.integradorarq.compliance.model.OsintReport;
import com.integradorarq.compliance.repository.AlertRepository;
import com.integradorarq.compliance.repository.OsintReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class ComplianceService {

    private static final Logger log = LoggerFactory.getLogger(ComplianceService.class);

    private final OsintReportRepository osintReportRepository;
    private final AlertRepository alertRepository;
    private final OpenSanctionsMockService openSanctionsMockService;
    private final RabbitTemplate rabbitTemplate;

    public ComplianceService(OsintReportRepository osintReportRepository,
                             AlertRepository alertRepository,
                             OpenSanctionsMockService openSanctionsMockService,
                             RabbitTemplate rabbitTemplate) {
        this.osintReportRepository = osintReportRepository;
        this.alertRepository = alertRepository;
        this.openSanctionsMockService = openSanctionsMockService;
        this.rabbitTemplate = rabbitTemplate;
    }

    @RabbitListener(queues = RabbitMQConfig.COMPLIANCE_QUEUE)
    public void processOsintCompletado(OsintCompletadoEvent event) {
        log.info("Received osint.completado for requestId: {}", event.getRequestId());

        if (event.getData() == null) {
            log.warn("Event data is null for requestId: {}", event.getRequestId());
            return;
        }

        // 1. Save to Elasticsearch
        OsintReport report = new OsintReport();
        report.setId(event.getRequestId());
        report.setTargetId(event.getTargetId());
        report.setFullName(event.getData().getFullName());
        report.setPdfUrl(event.getPdfUrl());
        report.setStatus(event.getStatus());
        report.setCompletedAt(event.getCompletedAt());
        report.setBirthDate(event.getData().getBirthDate());
        report.setCivilStatus(event.getData().getCivilStatus());
        report.setAnt(event.getData().getAnt());
        report.setSenescyt(event.getData().getSenescyt());
        report.setSri(event.getData().getSri());
        report.setIess(event.getData().getIess());
        
        osintReportRepository.save(report);
        log.info("Indexed OsintReport in Elasticsearch for requestId: {}", report.getId());

        // 2. Call OpenSanctions
        Map<String, Object> matchResult = openSanctionsMockService.checkName(report.getFullName());
        double score = (double) matchResult.getOrDefault("score", 0.0);

        // 3. Generate Alert if score > 0.8
        if (score > 0.8) {
            String alertId = UUID.randomUUID().toString();
            String riskLevel = (String) matchResult.get("riskLevel");
            String matchReason = (String) matchResult.get("matchReason");

            // Save in PostgreSQL
            Alert alert = new Alert(
                    alertId,
                    event.getRequestId(),
                    event.getTargetId(),
                    report.getFullName(),
                    riskLevel,
                    matchReason,
                    System.currentTimeMillis()
            );
            alertRepository.save(alert);
            log.info("Saved Alert in PostgreSQL with alertId: {}", alertId);

            // Publish alerta.compliance
            AlertaComplianceEvent alertaEvent = new AlertaComplianceEvent(
                    alertId,
                    alert.getRequestId(),
                    alert.getTargetId(),
                    alert.getFullName(),
                    alert.getRiskLevel(),
                    alert.getMatchReason(),
                    alert.getTimestamp()
            );

            rabbitTemplate.convertAndSend(RabbitMQConfig.OSINT_EXCHANGE, RabbitMQConfig.ROUTING_KEY_ALERTA_COMPLIANCE, alertaEvent);
            log.info("Published alerta.compliance event to RabbitMQ for alertId: {}", alertId);
        } else {
            log.info("No compliance alert generated for requestId: {} (score: {})", event.getRequestId(), score);
        }
    }
}
