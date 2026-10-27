package com.fleetops.controller;

import com.fleetops.dto.request.DriverDutyLocationRequest;
import com.fleetops.service.DriverDutyService;
import com.fleetops.service.DriverDutyService.DriverDutySession;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/driver/duty")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Driver Duty & Mobile GPS", description = "Endpoints for driver phone live GPS broadcasting and duty tracking")
public class DriverDutyController {

    private final DriverDutyService driverDutyService;

    @PostMapping("/location")
    @Operation(summary = "Broadcast driver mobile phone GPS telemetry")
    public ResponseEntity<DriverDutySession> postLocation(@RequestBody DriverDutyLocationRequest request,
                                                          Authentication authentication) {
        if ((request.getDriverUsername() == null || request.getDriverUsername().isBlank()) && authentication != null) {
            request.setDriverUsername(authentication.getName());
        }
        DriverDutySession session = driverDutyService.recordLocation(request);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/stop")
    @Operation(summary = "End duty session and stop live GPS broadcast")
    public ResponseEntity<Map<String, Object>> stopDuty(@RequestBody(required = false) Map<String, String> body,
                                                        Authentication authentication) {
        String username = (body != null && body.get("driverUsername") != null)
                ? body.get("driverUsername")
                : (authentication != null ? authentication.getName() : null);

        DriverDutySession session = driverDutyService.stopDuty(username);
        return ResponseEntity.ok(Map.of(
                "status", "OFF_DUTY",
                "message", "Driver duty ended successfully",
                "session", session != null ? session : "None"
        ));
    }

    @GetMapping("/session")
    @Operation(summary = "Get active duty session for current driver")
    public ResponseEntity<?> getSession(@RequestParam(required = false) String driverUsername,
                                        Authentication authentication) {
        String username = (driverUsername != null && !driverUsername.isBlank())
                ? driverUsername
                : (authentication != null ? authentication.getName() : "driver1");

        return driverDutyService.getSession(username)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("status", "OFF_DUTY", "driverUsername", username)));
    }

    @GetMapping("/active")
    @Operation(summary = "List all active phone-tracking drivers")
    public ResponseEntity<List<DriverDutySession>> getActiveSessions() {
        return ResponseEntity.ok(driverDutyService.getActiveSessions());
    }
}
