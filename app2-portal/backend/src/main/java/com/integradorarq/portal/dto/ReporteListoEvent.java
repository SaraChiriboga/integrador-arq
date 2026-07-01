package com.integradorarq.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReporteListoEvent {
    private String requestId;
    private String pdfUrl;
    private String email;
    private String status;
}
