package com.integradorarq.compliance.controller;

import com.integradorarq.compliance.model.Alert;
import com.integradorarq.compliance.model.OsintReport;
import com.integradorarq.compliance.repository.AlertRepository;
import com.integradorarq.compliance.repository.OsintReportRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/compliance")
@CrossOrigin(origins = "*") // Allows React frontend to connect
public class ComplianceController {

    private final AlertRepository alertRepository;
    private final OsintReportRepository osintReportRepository;

    public ComplianceController(AlertRepository alertRepository, OsintReportRepository osintReportRepository) {
        this.alertRepository = alertRepository;
        this.osintReportRepository = osintReportRepository;
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Alert>> getAlerts() {
        List<Alert> alerts = alertRepository.findAllByOrderByTimestampDesc();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/search")
    public ResponseEntity<List<OsintReport>> searchReports(@RequestParam String q) {
        List<OsintReport> reports = osintReportRepository.findByFullNameContainingOrTargetId(q, q);
        return ResponseEntity.ok(reports);
    }
}
