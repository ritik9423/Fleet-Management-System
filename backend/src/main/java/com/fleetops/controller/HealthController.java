package com.fleetops.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    /**
     * Ultra-fast health check for Render platform liveness check (no DB dependency).
     */
    @GetMapping({"/", "/healthz"})
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "fleet-ops-backend",
                "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Pre-warming API health endpoint used by frontend on login page load.
     * Actively pings the database connection pool so the database is hot and ready for instant login.
     */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> apiHealthCheck() {
        boolean dbWarm = false;
        long start = System.currentTimeMillis();
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("/* health-ping-warmup */ SELECT 1");
            dbWarm = true;
        } catch (Exception e) {
            log.warn("Health check DB ping failed: {}", e.getMessage());
        }
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("database", dbWarm ? "CONNECTED_WARM" : "DEGRADED");
        response.put("dbPingMs", duration);
        response.put("service", "fleet-ops-backend");
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }
}
