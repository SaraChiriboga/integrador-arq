package com.integradorarq.portal.dto;

import com.integradorarq.portal.model.Request;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZoneId;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private String requestId;
    private String cedula;
    private String status;
    private String pdfUrl;
    private Long createdAt;
    private Long completedAt;

    public static ReportResponse fromEntity(Request request) {
        return ReportResponse.builder()
                .requestId(request.getId().toString())
                .cedula(request.getTargetId())
                .status(request.getStatus().name())
                .pdfUrl(request.getPdfUrl())
                .createdAt(request.getCreatedAt() != null ? 
                        request.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .completedAt(request.getCompletedAt() != null ? 
                        request.getCompletedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .build();
    }
}
