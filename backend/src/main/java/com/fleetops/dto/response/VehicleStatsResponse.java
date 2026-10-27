package com.fleetops.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehicleStatsResponse {
    private Long vehicleId;
    private String licensePlate;
    private String makeModel;
    private double totalDistanceKm;
    private double totalFuelUsed;
    private double totalMaintenanceCost;
    private long tripCount;
}
