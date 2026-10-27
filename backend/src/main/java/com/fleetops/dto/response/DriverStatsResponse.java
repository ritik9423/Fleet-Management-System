package com.fleetops.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DriverStatsResponse {
    private Long driverId;
    private String driverName;
    private long tripsCompleted;
    private double totalDistanceKm;
    private String assignedVehiclePlate;
}
