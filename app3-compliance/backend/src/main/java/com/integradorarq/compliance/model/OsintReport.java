package com.integradorarq.compliance.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import java.util.Map;
import java.util.List;

@Document(indexName = "osint_reports")
public class OsintReport {
    @Id
    private String id;
    
    @Field(type = FieldType.Keyword)
    private String targetId;
    
    @Field(type = FieldType.Text, analyzer = "spanish")
    private String fullName;
    
    @Field(type = FieldType.Keyword)
    private String pdfUrl;
    
    @Field(type = FieldType.Keyword)
    private String status;
    
    @Field(type = FieldType.Long)
    private Long completedAt;

    @Field(type = FieldType.Text)
    private String birthDate;
    
    @Field(type = FieldType.Keyword)
    private String civilStatus;
    
    @Field(type = FieldType.Object)
    private Map<String, Object> ant;
    
    @Field(type = FieldType.Nested)
    private List<Map<String, Object>> senescyt;
    
    @Field(type = FieldType.Object)
    private Map<String, Object> sri;
    
    @Field(type = FieldType.Object)
    private Map<String, Object> iess;

    public OsintReport() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getCompletedAt() { return completedAt; }
    public void setCompletedAt(Long completedAt) { this.completedAt = completedAt; }
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
