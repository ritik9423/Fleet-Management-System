package com.fleetops.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AnalyticsSummaryResponse {
    private long totalVehicles;
    private long activeVehicles;
    private double fleetUtilizationPercent;
    private long totalDrivers;
    private long activeDrivers;
    private long tripsInProgress;
    private long tripsCompleted;
    private double totalDistanceKm;
    private int overdueMaintenanceCount;
    private int upcomingMaintenanceCount;
    private List<DriverStatsResponse> topDrivers;
}
