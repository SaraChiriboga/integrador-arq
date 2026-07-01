package com.integradorarq.notifications.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Espejo de docs/event-contracts/reporte.listo.json (publicado por App2).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporteListoEvent {
    private String requestId;
    private String pdfUrl;
    private String email;
    private String status;
}
