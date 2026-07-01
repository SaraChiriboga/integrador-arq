package com.integradorarq.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudOsintEvent {
    private String requestId;
    private String targetId;
    private String requesterEmail;
    private Long timestamp;
}
