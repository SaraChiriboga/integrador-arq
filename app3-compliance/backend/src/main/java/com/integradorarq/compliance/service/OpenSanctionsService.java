package com.integradorarq.compliance.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenSanctionsService {

    private static final Logger log = LoggerFactory.getLogger(OpenSanctionsService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${compliance.opensanctions.api-url:https://api.opensanctions.org/match/default}")
    private String apiUrl;

    @Value("${compliance.opensanctions.api-key:}")
    private String apiKey;

    public Map<String, Object> checkName(String fullName) {
        Map<String, Object> result = new HashMap<>();

        if (fullName == null || fullName.trim().isEmpty()) {
            result.put("score", 0.0);
            result.put("matchReason", "No name provided");
            result.put("riskLevel", "LOW");
            return result;
        }

        // Si la clave no está configurada o la URL apunta a localhost/mock, usamos el mock local
        if (apiKey == null || apiKey.trim().isEmpty() || apiUrl.contains("localhost") || apiUrl.contains("mock")) {
            log.info("OpenSanctions API key not configured or mock URL detected. Running in MOCK mode for: {}", fullName);
            return runMockCheck(fullName);
        }

        try {
            log.info("Querying real OpenSanctions API for name: {}", fullName);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "ApiKey " + apiKey);

            Map<String, Object> properties = new HashMap<>();
            properties.put("name", List.of(fullName));

            Map<String, Object> q1 = new HashMap<>();
            q1.put("schema", "Person");
            q1.put("properties", properties);

            Map<String, Object> queries = new HashMap<>();
            queries.put("q1", q1);

            Map<String, Object> payload = new HashMap<>();
            payload.put("queries", queries);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(apiUrl, requestEntity, Map.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map responseBody = responseEntity.getBody();
                Map responses = (Map) responseBody.get("responses");
                if (responses != null) {
                    Map q1Result = (Map) responses.get("q1");
                    if (q1Result != null) {
                        List resultsList = (List) q1Result.get("results");
                        if (resultsList != null && !resultsList.isEmpty()) {
                            // Obtener el primer resultado (el match de mayor score)
                            Map firstMatch = (Map) resultsList.get(0);
                            double score = 0.0;
                            Object scoreObj = firstMatch.get("score");
                            if (scoreObj instanceof Number) {
                                score = ((Number) scoreObj).doubleValue();
                            } else if (scoreObj instanceof String) {
                                score = Double.parseDouble((String) scoreObj);
                            }

                            String caption = (String) firstMatch.get("caption");
                            Map matchProperties = (Map) firstMatch.get("properties");
                            List topics = matchProperties != null ? (List) matchProperties.get("topics") : null;

                            log.info("OpenSanctions matched entity: {} with score: {}", caption, score);

                            result.put("score", score);
                            result.put("matchReason", String.format("Coincidencia del %.0f%% con la entidad '%s' en la base de datos de OpenSanctions.", score * 100, caption));
                            if (score > 0.8) {
                                result.put("riskLevel", "HIGH");
                            } else if (score > 0.5) {
                                result.put("riskLevel", "MEDIUM");
                            } else {
                                result.put("riskLevel", "LOW");
                            }
                            return result;
                        }
                    }
                }
            }
            log.warn("OpenSanctions API returned no results or invalid structure.");
        } catch (Exception e) {
            log.error("Error calling OpenSanctions API: {}", e.getMessage(), e);
        }

        // Fallback to mock logic in case of network errors
        log.warn("Falling back to MOCK mode for: {}", fullName);
        return runMockCheck(fullName);
    }

    private Map<String, Object> runMockCheck(String fullName) {
        Map<String, Object> result = new HashMap<>();
        String upperName = fullName.toUpperCase();

        if (upperName.contains("PEREZ") || upperName.contains("SANCIONADO")) {
            result.put("score", 0.89);
            result.put("matchReason", "Coincidencia 89% con lista de PEPs/Sanciones en OpenSanctions (MOCK)");
            result.put("riskLevel", "HIGH");
        } else {
            result.put("score", 0.1);
            result.put("matchReason", "No risk found (MOCK)");
            result.put("riskLevel", "LOW");
        }
        return result;
    }
}
