package com.integradorarq.portal.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OsintCompletadoEvent {
    private String requestId;
    private String targetId;
    private String pdfUrl;
    private String status;
    private Long completedAt;
}
