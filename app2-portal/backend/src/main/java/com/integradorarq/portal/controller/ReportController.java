package com.integradorarq.portal.controller;

import com.integradorarq.portal.dto.CreateReportRequest;
import com.integradorarq.portal.dto.ReportResponse;
import com.integradorarq.portal.model.Request;
import com.integradorarq.portal.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reportes", description = "Endpoints para la gestión de reportes OSINT de los ciudadanos")
public class ReportController {

    private final ReportService reportService;

    @Operation(summary = "Crear nuevo reporte", description = "Inicia el proceso asíncrono para generar un reporte de antecedentes OSINT a partir de la cédula.")
    @ApiResponse(responseCode = "202", description = "Solicitud aceptada y en proceso")
    @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    @ApiResponse(responseCode = "409", description = "Ya existe una solicitud en proceso para esta cédula")
    @PostMapping
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody CreateReportRequest createReportRequest) {
        Request request = reportService.createReport(createReportRequest.cedula(), createReportRequest.email());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ReportResponse.fromEntity(request));
    }

    @Operation(summary = "Consultar estado de reporte", description = "Obtiene el estado actual y detalles de un reporte OSINT mediante su ID único.")
    @ApiResponse(responseCode = "200", description = "Reporte encontrado")
    @ApiResponse(responseCode = "404", description = "Reporte no encontrado con el ID proporcionado")
    @GetMapping("/{requestId}")
    public ResponseEntity<ReportResponse> getReport(@PathVariable UUID requestId) {
        Request request = reportService.findById(requestId);
        return ResponseEntity.ok(ReportResponse.fromEntity(request));
    }
}
