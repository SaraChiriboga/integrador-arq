package com.integradorarq.compliance.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;

@Service
@Profile("!prod") // Active in dev/local
public class OpenSanctionsMockService {

    public Map<String, Object> checkName(String fullName) {
        Map<String, Object> result = new HashMap<>();
        
        if (fullName == null) {
            result.put("score", 0.0);
            return result;
        }
        
        String upperName = fullName.toUpperCase();
        
        // Mock logic: if name contains "PEREZ" or "SANCIONADO", return high score
        if (upperName.contains("PEREZ") || upperName.contains("SANCIONADO")) {
            result.put("score", 0.89);
            result.put("matchReason", "Coincidencia 89% con lista de PEPs/Sanciones en OpenSanctions (MOCK)");
            result.put("riskLevel", "HIGH");
        } else {
            result.put("score", 0.1);
            result.put("matchReason", "No risk found");
            result.put("riskLevel", "LOW");
        }
        
        return result;
    }
}
