package com.fleetops.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Eagerly pre-warms the HikariCP database connection pool upon application startup.
 * Ensures the first incoming login request does not suffer cold TLS/SSL handshake latency with Aiven MySQL.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseConnectionWarmup implements ApplicationListener<ApplicationReadyEvent> {

    private final DataSource dataSource;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("[FleetOps Warmup] Initializing and pre-warming database connection pool...");
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("/* fleetops-startup-warmup */ SELECT 1");
            log.info("[FleetOps Warmup] HikariCP database connection pool warmed up successfully.");
        } catch (Exception e) {
            log.warn("[FleetOps Warmup] Warning: Database pre-warm skipped or failed: {}", e.getMessage());
        }
    }
}
