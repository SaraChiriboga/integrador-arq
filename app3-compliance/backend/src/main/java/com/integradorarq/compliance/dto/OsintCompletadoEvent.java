package com.integradorarq.compliance.dto;

import java.util.Map;
import java.util.List;

public class OsintCompletadoEvent {
    private String requestId;
    private String targetId;
    private String pdfUrl;
    private String status;
    private Long completedAt;
    private OsintData data;

    public OsintCompletadoEvent() {}

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getCompletedAt() { return completedAt; }
    public void setCompletedAt(Long completedAt) { this.completedAt = completedAt; }

    public OsintData getData() { return data; }
    public void setData(OsintData data) { this.data = data; }

    public static class OsintData {
        private String fullName;
        private String birthDate;
        private String civilStatus;
        private Map<String, Object> ant;
        private List<Map<String, Object>> senescyt;
        private Map<String, Object> sri;
        private Map<String, Object> iess;

        public OsintData() {}

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getBirthDate() { return birthDate; }
        public void setBirthDate(String birthDate) { this.birthDate = birthDate; }
        public String getCivilStatus() { return civilStatus; }
        public void setCivilStatus(String civilStatus) { this.civilStatus = civilStatus; }
        public Map<String, Object> getAnt() { return ant; }
        public void setAnt(Map<String, Object> ant) { this.ant = ant; }
        public List<Map<String, Object>> getSenescyt() { return senescyt; }
        public void setSenescyt(List<Map<String, Object>> senescyt) { this.senescyt = senescyt; }
        public Map<String, Object> getSri() { return sri; }
        public void setSri(Map<String, Object> sri) { this.sri = sri; }
        public Map<String, Object> getIess() { return iess; }
        public void setIess(Map<String, Object> iess) { this.iess = iess; }
    }
}
