package com.fleetops.service;

import com.fleetops.dto.LiveVehicleDto;
import com.fleetops.dto.request.DriverDutyLocationRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class DriverDutyService {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriverDutySession {
        private String driverUsername;
        private String driverName;
        private String vehiclePlate;
        private Double lastLatitude;
        private Double lastLongitude;
        private Double lastSpeed;
        private Double lastHeading;
        private Double accuracy;
        private Double batteryLevel;
        private Long dutyStartTime;
        private Long lastPingTimestamp;
        private Double totalDistanceKm;
        private String status; // "ON_DUTY", "DRIVING", "STOPPED", "OFF_DUTY"
        private String notes;

        public String getDriverUsername() { return driverUsername; }
        public String getDriverName() { return driverName; }
        public String getVehiclePlate() { return vehiclePlate; }
        public Double getLastLatitude() { return lastLatitude; }
        public Double getLastLongitude() { return lastLongitude; }
        public Double getLastSpeed() { return lastSpeed; }
        public Double getLastHeading() { return lastHeading; }
        public Double getAccuracy() { return accuracy; }
        public Double getBatteryLevel() { return batteryLevel; }
        public Long getDutyStartTime() { return dutyStartTime; }
        public Long getLastPingTimestamp() { return lastPingTimestamp; }
        public Double getTotalDistanceKm() { return totalDistanceKm; }
        public String getStatus() { return status; }
        public String getNotes() { return notes; }
    }

    private final Map<String, DriverDutySession> activeSessions = new ConcurrentHashMap<>();

    /**
     * Record a live GPS ping from a driver's mobile device
     */
    public DriverDutySession recordLocation(DriverDutyLocationRequest request) {
        if (request.getDriverUsername() == null || request.getDriverUsername().isBlank()) {
            throw new IllegalArgumentException("Driver username is required for duty tracking");
        }

        long now = System.currentTimeMillis();
        String username = request.getDriverUsername().trim();

        DriverDutySession session = activeSessions.compute(username, (key, existing) -> {
            long startTime = now;
            double totalDistance = 0.0;

            if (existing != null) {
                if (existing.getDutyStartTime() != null) {
                    startTime = existing.getDutyStartTime();
                }
                if (existing.getTotalDistanceKm() != null) {
                    totalDistance = existing.getTotalDistanceKm();
                }

                if (existing.getLastLatitude() != null && existing.getLastLongitude() != null
                        && request.getLatitude() != null && request.getLongitude() != null) {
                    double distanceToAdd = calculateHaversineKm(
                            existing.getLastLatitude(), existing.getLastLongitude(),
                            request.getLatitude(), request.getLongitude()
                    );
                    // Filter out GPS stationary jitter (< 5 meters) and extreme teleport jumps (> 15 km)
                    if (distanceToAdd >= 0.005 && distanceToAdd < 15.0) {
                        totalDistance += distanceToAdd;
                    }
                }
            }

            return DriverDutySession.builder()
                    .driverUsername(username)
                    .driverName(request.getDriverName() != null ? request.getDriverName() : username)
                    .vehiclePlate(request.getVehiclePlate() != null && !request.getVehiclePlate().isBlank()
                            ? request.getVehiclePlate().toUpperCase()
                            : "MOBILE-TRUCK-01")
                    .lastLatitude(request.getLatitude())
                    .lastLongitude(request.getLongitude())
                    .lastSpeed(request.getSpeed() != null ? request.getSpeed() : 0.0)
                    .lastHeading(request.getHeading() != null ? request.getHeading() : 0.0)
                    .accuracy(request.getAccuracy())
                    .batteryLevel(request.getBatteryLevel() != null ? request.getBatteryLevel() : 90.0)
                    .dutyStartTime(startTime)
                    .lastPingTimestamp(now)
                    .totalDistanceKm(Math.round(totalDistance * 100.0) / 100.0)
                    .status(request.getStatus() != null ? request.getStatus() : "ON_DUTY")
                    .notes(request.getNotes())
                    .build();
        });

        log.debug("Recorded live GPS from driver {}: lat={}, lng={}, speed={}km/h, dist={}km",
                username, session.getLastLatitude(), session.getLastLongitude(), session.getLastSpeed(), session.getTotalDistanceKm());

        return session;
    }

    /**
     * Stop duty for a driver
     */
    public DriverDutySession stopDuty(String driverUsername) {
        if (driverUsername == null) return null;
        DriverDutySession removed = activeSessions.remove(driverUsername.trim());
        if (removed != null) {
            removed.setStatus("OFF_DUTY");
            removed.setLastPingTimestamp(System.currentTimeMillis());
            log.info("Driver {} went OFF DUTY. Total distance: {} km", driverUsername, removed.getTotalDistanceKm());
        }
        return removed;
    }

    /**
     * Get active session for a specific driver
     */
    public Optional<DriverDutySession> getSession(String driverUsername) {
        if (driverUsername == null) return Optional.empty();
        return Optional.ofNullable(activeSessions.get(driverUsername.trim()));
    }

    /**
     * Get all active sessions (pinged within last 10 minutes)
     */
    public List<DriverDutySession> getActiveSessions() {
        long timeout = System.currentTimeMillis() - (10 * 60 * 1000); // 10 mins
        return activeSessions.values().stream()
                .filter(s -> s.getLastPingTimestamp() != null && s.getLastPingTimestamp() >= timeout)
                .toList();
    }

    /**
     * Convert active phone GPS sessions into LiveVehicleDto objects for map rendering
     */
    public List<LiveVehicleDto> convertSessionsToLiveVehicles() {
        List<DriverDutySession> active = getActiveSessions();
        List<LiveVehicleDto> dtoList = new ArrayList<>();

        for (DriverDutySession session : active) {
            if (session.getLastLatitude() == null || session.getLastLongitude() == null) continue;

            boolean isDriving = (session.getLastSpeed() != null && session.getLastSpeed() > 1.5)
                    || "DRIVING".equalsIgnoreCase(session.getStatus());

            LiveVehicleDto dto = LiveVehicleDto.builder()
                    .deviceId("PHONE-" + session.getDriverUsername())
                    .vehicleName(session.getVehiclePlate() + " [Phone GPS]")
                    .vehicleNumber(session.getVehiclePlate())
                    .latitude(session.getLastLatitude())
                    .longitude(session.getLastLongitude())
                    .speed(session.getLastSpeed() != null ? Math.round(session.getLastSpeed() * 10.0) / 10.0 : 0.0)
                    .ignitionOn(isDriving)
                    .status(isDriving ? "ACTIVE" : "IDLE")
                    .battery(session.getBatteryLevel() != null ? session.getBatteryLevel() : 95.0)
                    .timestamp(session.getLastPingTimestamp())
                    .address("Live Mobile GPS Corridor • Driver: " + session.getDriverName())
                    .build();

            dtoList.add(dto);
        }

        return dtoList;
    }

    private double calculateHaversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in KM
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
