package com.fleetops.service;

import com.fleetops.dto.response.AnalyticsSummaryResponse;
import com.fleetops.dto.response.DriverStatsResponse;
import com.fleetops.dto.response.VehicleStatsResponse;
import com.fleetops.model.Driver;
import com.fleetops.model.Trip;
import com.fleetops.model.enums.TripStatus;
import com.fleetops.repository.DriverRepository;
import com.fleetops.repository.MaintenanceRepository;
import com.fleetops.repository.TripRepository;
import com.fleetops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final MaintenanceRepository maintenanceRepository;

    public AnalyticsSummaryResponse getSummary() {
        long totalVehicles = vehicleRepository.countActive();
        long activeVehicles = vehicleRepository.countInUse();
        double utilizationPct = totalVehicles > 0
                ? Math.round((activeVehicles * 100.0 / totalVehicles) * 10.0) / 10.0
                : 0.0;

        long totalDrivers = driverRepository.count();
        long activeDrivers = driverRepository.findByActiveTrue().size();

        long tripsInProgress = tripRepository.findByStatus(TripStatus.IN_PROGRESS).size();
        long tripsCompleted = tripRepository.findByStatus(TripStatus.COMPLETED).size();

        double totalDistance = tripRepository.findAll().stream()
                .filter(t -> t.getDistance() != null)
                .mapToDouble(t -> t.getDistance().doubleValue())
                .sum();

        int overdueCount = maintenanceRepository.findOverdue(LocalDate.now()).size();
        int upcomingCount = maintenanceRepository.findUpcoming(LocalDate.now(), LocalDate.now().plusDays(7)).size();

        List<DriverStatsResponse> topDrivers = getDriverStats().stream()
                .sorted((a, b) -> Long.compare(b.getTripsCompleted(), a.getTripsCompleted()))
                .limit(5)
                .toList();

        return AnalyticsSummaryResponse.builder()
                .totalVehicles(totalVehicles)
                .activeVehicles(activeVehicles)
                .fleetUtilizationPercent(utilizationPct)
                .totalDrivers(totalDrivers)
                .activeDrivers(activeDrivers)
                .tripsInProgress(tripsInProgress)
                .tripsCompleted(tripsCompleted)
                .totalDistanceKm(totalDistance)
                .overdueMaintenanceCount(overdueCount)
                .upcomingMaintenanceCount(upcomingCount)
                .topDrivers(topDrivers)
                .build();
    }

    public List<VehicleStatsResponse> getVehicleStats() {
        return vehicleRepository.findAll().stream()
                .map(v -> VehicleStatsResponse.builder()
                        .vehicleId(v.getId())
                        .licensePlate(v.getLicensePlate())
                        .makeModel(v.getMake() + " " + v.getModel())
                        .totalDistanceKm(nullToZero(tripRepository.sumDistanceByVehicle(v.getId())))
                        .totalFuelUsed(nullToZero(tripRepository.sumFuelByVehicle(v.getId())))
                        .totalMaintenanceCost(nullToZero(maintenanceRepository.sumCostByVehicle(v.getId())))
                        .tripCount(tripRepository.findByVehicleId(v.getId()).size())
                        .build())
                .toList();
    }

    public List<DriverStatsResponse> getDriverStats() {
        return driverRepository.findAll().stream()
                .map(d -> DriverStatsResponse.builder()
                        .driverId(d.getId())
                        .driverName(d.getFullName())
                        .tripsCompleted(tripRepository.countCompletedByDriver(d.getId()))
                        .totalDistanceKm(nullToZero(tripRepository.sumDistanceByDriver(d.getId())))
                        .assignedVehiclePlate(d.getAssignedVehicle() != null
                                ? d.getAssignedVehicle().getLicensePlate() : null)
                        .build())
                .toList();
    }

    public AnalyticsSummaryResponse getDriverSummary(String username) {
        Driver driver = driverRepository.findByUsernameOrEmail(username).orElse(null);
        if (driver == null) {
            return AnalyticsSummaryResponse.builder().build();
        }
        List<Trip> trips = tripRepository.findByDriverId(driver.getId());
        long tripsInProgress = trips.stream().filter(t -> t.getStatus() == TripStatus.IN_PROGRESS).count();
        long tripsCompleted = trips.stream().filter(t -> t.getStatus() == TripStatus.COMPLETED).count();
        double totalDistance = trips.stream()
                .filter(t -> t.getDistance() != null)
                .mapToDouble(t -> t.getDistance().doubleValue())
                .sum();
        long totalVehicles = driver.getAssignedVehicle() != null ? 1 : 0;
        long activeVehicles = (driver.getAssignedVehicle() != null && tripsInProgress > 0) ? 1 : 0;
        double utilizationPct = totalVehicles > 0 && activeVehicles > 0 ? 100.0 : 0.0;

        return AnalyticsSummaryResponse.builder()
                .totalVehicles(totalVehicles)
                .activeVehicles(activeVehicles)
                .fleetUtilizationPercent(utilizationPct)
                .totalDrivers(1)
                .activeDrivers(Boolean.TRUE.equals(driver.getActive()) ? 1 : 0)
                .tripsInProgress(tripsInProgress)
                .tripsCompleted(tripsCompleted)
                .totalDistanceKm(Math.round(totalDistance * 10.0) / 10.0)
                .overdueMaintenanceCount(0)
                .upcomingMaintenanceCount(0)
                .topDrivers(List.of())
                .build();
    }

    public List<DriverStatsResponse> getStatsForDriver(String username) {
        return driverRepository.findByUsernameOrEmail(username)
                .map(d -> List.of(DriverStatsResponse.builder()
                        .driverId(d.getId())
                        .driverName(d.getFullName())
                        .tripsCompleted(tripRepository.countCompletedByDriver(d.getId()))
                        .totalDistanceKm(nullToZero(tripRepository.sumDistanceByDriver(d.getId())))
                        .assignedVehiclePlate(d.getAssignedVehicle() != null
                                ? d.getAssignedVehicle().getLicensePlate() : null)
                        .build()))
                .orElse(List.of());
    }

    private double nullToZero(Double value) {
        return value != null ? value : 0.0;
    }
}
