package com.fleetops.controller;

import com.fleetops.dto.response.AnalyticsSummaryResponse;
import com.fleetops.dto.response.DriverStatsResponse;
import com.fleetops.dto.response.VehicleStatsResponse;
import com.fleetops.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Fleet performance metrics and reporting")
@SecurityRequirement(name = "Bearer Authentication")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    @Operation(summary = "Fleet-wide summary or personalized driver summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<AnalyticsSummaryResponse> getSummary(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            return ResponseEntity.ok(analyticsService.getDriverSummary(authentication.getName()));
        }
        return ResponseEntity.ok(analyticsService.getSummary());
    }

    @GetMapping("/vehicles")
    @Operation(summary = "Per-vehicle stats: distance, fuel, maintenance cost")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VehicleStatsResponse>> getVehicleStats() {
        return ResponseEntity.ok(analyticsService.getVehicleStats());
    }

    @GetMapping("/drivers")
    @Operation(summary = "Per-driver stats: trips completed, total distance (scoped for DRIVER)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<List<DriverStatsResponse>> getDriverStats(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            return ResponseEntity.ok(analyticsService.getStatsForDriver(authentication.getName()));
        }
        return ResponseEntity.ok(analyticsService.getDriverStats());
    }
}
