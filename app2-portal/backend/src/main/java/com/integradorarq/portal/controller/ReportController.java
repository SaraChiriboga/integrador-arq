package com.integradorarq.portal.controller;

import com.integradorarq.portal.dto.CreateReportRequest;
import com.integradorarq.portal.dto.ReportResponse;
import com.integradorarq.portal.model.Request;
import com.integradorarq.portal.service.ReportService;
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
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody CreateReportRequest createReportRequest) {
        Request request = reportService.createReport(createReportRequest.cedula(), createReportRequest.email());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ReportResponse.fromEntity(request));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<ReportResponse> getReport(@PathVariable UUID requestId) {
        Request request = reportService.findById(requestId);
        return ResponseEntity.ok(ReportResponse.fromEntity(request));
    }
}
