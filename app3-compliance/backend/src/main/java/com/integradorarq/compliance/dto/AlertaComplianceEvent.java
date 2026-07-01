package com.integradorarq.compliance.dto;

public class AlertaComplianceEvent {
    private String alertId;
    private String requestId;
    private String targetId;
    private String fullName;
    private String riskLevel;
    private String matchReason;
    private Long timestamp;

    public AlertaComplianceEvent() {}

    public AlertaComplianceEvent(String alertId, String requestId, String targetId, String fullName, String riskLevel, String matchReason, Long timestamp) {
        this.alertId = alertId;
        this.requestId = requestId;
        this.targetId = targetId;
        this.fullName = fullName;
        this.riskLevel = riskLevel;
        this.matchReason = matchReason;
        this.timestamp = timestamp;
    }

    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getMatchReason() { return matchReason; }
    public void setMatchReason(String matchReason) { this.matchReason = matchReason; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
}
