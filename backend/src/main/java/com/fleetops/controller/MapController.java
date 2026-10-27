package com.fleetops.controller;

import com.fleetops.dto.LiveVehicleDto;
import com.fleetops.model.Driver;
import com.fleetops.model.Vehicle;
import com.fleetops.repository.DriverRepository;
import com.fleetops.service.DriverDutyService;
import com.fleetops.service.InTouchService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/map")
@CrossOrigin(origins = "*")
public class MapController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.mappls.client-id:}")
    private String defaultClientId;

    @Value("${app.mappls.client-secret:}")
    private String defaultClientSecret;

    private final InTouchService inTouchService;
    private final DriverRepository driverRepository;
    private final DriverDutyService driverDutyService;

    public MapController(InTouchService inTouchService,
                         DriverRepository driverRepository,
                         DriverDutyService driverDutyService) {
        this.inTouchService = inTouchService;
        this.driverRepository = driverRepository;
        this.driverDutyService = driverDutyService;
    }

    @GetMapping("/intouch/live")
    public ResponseEntity<?> getLiveVehicles(Authentication authentication) {
        try {
            List<LiveVehicleDto> all = inTouchService.getLiveDevices();
            if (authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
                String username = authentication.getName();
                Optional<Driver> driverOpt = driverRepository.findByUsernameOrEmail(username);
                List<LiveVehicleDto> driverOnly = new ArrayList<>();

                String assignedPlate = driverOpt.map(Driver::getAssignedVehicle)
                        .map(Vehicle::getLicensePlate)
                        .orElse(null);

                // Check matching InTouch GPS device
                if (assignedPlate != null) {
                    for (LiveVehicleDto dev : all) {
                        if (dev.getVehicleNumber() != null && dev.getVehicleNumber().equalsIgnoreCase(assignedPlate)) {
                            driverOnly.add(dev);
                        } else if (dev.getVehicleName() != null && dev.getVehicleName().toLowerCase().contains(assignedPlate.toLowerCase())) {
                            driverOnly.add(dev);
                        }
                    }
                }

                // Check phone duty GPS
                for (LiveVehicleDto dev : all) {
                    if (dev.getDeviceId() != null && dev.getDeviceId().equalsIgnoreCase("PHONE-" + username)) {
                        if (!driverOnly.contains(dev)) {
                            driverOnly.add(dev);
                        }
                    }
                }

                // Fallback: if vehicle is assigned in database but not in live InTouch telemetry feed yet
                if (driverOnly.isEmpty() && driverOpt.isPresent() && driverOpt.get().getAssignedVehicle() != null) {
                    Vehicle v = driverOpt.get().getAssignedVehicle();
                    var dutySession = driverDutyService.getSession(username);
                    double lat = dutySession.map(DriverDutyService.DriverDutySession::getLastLatitude).orElse(28.6139);
                    double lng = dutySession.map(DriverDutyService.DriverDutySession::getLastLongitude).orElse(77.2090);
                    double speed = dutySession.map(DriverDutyService.DriverDutySession::getLastSpeed).orElse(0.0);

                    driverOnly.add(LiveVehicleDto.builder()
                            .deviceId("UNIT-" + v.getId())
                            .vehicleName(v.getMake() + " " + v.getModel())
                            .vehicleNumber(v.getLicensePlate())
                            .latitude(lat)
                            .longitude(lng)
                            .speed(speed)
                            .ignitionOn(speed > 0)
                            .status(v.getStatus() != null ? v.getStatus().name() : "ACTIVE")
                            .battery(88.0)
                            .address("Assigned Logistics Corridor")
                            .timestamp(System.currentTimeMillis())
                            .build());
                }

                return ResponseEntity.ok(driverOnly);
            }
            return ResponseEntity.ok(all);
        } catch (Exception e) {
            return errorResponse(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @GetMapping("/intouch/trips")
    public ResponseEntity<?> getLiveTrips(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            return ResponseEntity.ok(List.of());
        }
        try {
            return ResponseEntity.ok(inTouchService.getLiveTrips());
        } catch (Exception e) {
            return errorResponse(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @GetMapping("/intouch/devices")
    public ResponseEntity<?> getAllDevices(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            return ResponseEntity.ok(List.of());
        }
        try {
            return ResponseEntity.ok(inTouchService.getAllDevices());
        } catch (Exception e) {
            return errorResponse(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @GetMapping("/intouch/geofences")
    public ResponseEntity<?> getGeofences() {
        try {
            return ResponseEntity.ok(inTouchService.getGeofences());
        } catch (Exception e) {
            return errorResponse(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @GetMapping("/intouch/alarms")
    public ResponseEntity<?> getAlarms(@RequestParam(required = false) String entityId) {
        try {
            return ResponseEntity.ok(inTouchService.getAlarmLogs(entityId));
        } catch (Exception e) {
            return errorResponse(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @GetMapping("/intouch/daily-summary")
    public ResponseEntity<?> getDailySummary(@RequestParam String id,
                                             @RequestParam(required = false) Long startTime) {
        try {
            return ResponseEntity.ok(inTouchService.getDailySummary(id, startTime));
        } catch (Exception e) {
            return errorResponse(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @GetMapping("/intouch/overview")
    public ResponseEntity<?> getFleetOverview(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            Map<String, Object> driverOverview = new java.util.LinkedHashMap<>();
            driverOverview.put("totalVehicles", 1);
            driverOverview.put("activeVehicles", 1);
            driverOverview.put("movingVehicles", 1);
            driverOverview.put("stoppedVehicles", 0);
            driverOverview.put("idleVehicles", 0);
            driverOverview.put("totalTodayKms", 0.0);
            driverOverview.put("totalGeofences", 1);
            driverOverview.put("alertsCount", 0);
            driverOverview.put("recentAlerts", List.of());
            driverOverview.put("activeDispatches", List.of());
            driverOverview.put("provider", "Driver Telematics Hub");
            return ResponseEntity.ok(driverOverview);
        }
        try {
            return ResponseEntity.ok(inTouchService.getFleetOverview());
        } catch (Exception e) {
            return errorResponse(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @PostMapping("/token")
    public ResponseEntity<?> getMapplsToken(@RequestBody(required = false) Map<String, String> request) {
        String clientId = (request != null && request.get("clientId") != null) ? request.get("clientId") : defaultClientId;
        String clientSecret = (request != null && request.get("clientSecret") != null) ? request.get("clientSecret") : defaultClientSecret;

        if (clientId == null || clientSecret == null || clientId.isBlank() || clientSecret.isBlank()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "clientId and clientSecret are required");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");
            body.add("client_id", clientId.trim());
            body.add("client_secret", clientSecret.trim());

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                "https://outpost.mappls.com/api/security/oauth/token",
                HttpMethod.POST,
                entity,
                responseType
            );

            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return errorResponse(HttpStatus.UNAUTHORIZED, "Mappls OAuth error: " + e.getMessage());
        }
    }

    private ResponseEntity<Map<String, String>> errorResponse(HttpStatus status, String message) {
        return new ResponseEntity<>(Map.of("error", message != null ? message : "Unknown error"), status);
    }
}
