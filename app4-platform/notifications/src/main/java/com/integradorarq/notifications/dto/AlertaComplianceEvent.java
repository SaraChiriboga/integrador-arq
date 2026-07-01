package com.integradorarq.notifications.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Espejo de docs/event-contracts/alerta.compliance.json (publicado por App3).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertaComplianceEvent {
    private String alertId;
    private String requestId;
    private String targetId;
    private String fullName;
    private String riskLevel;
    private String matchReason;
    private long timestamp;
}
