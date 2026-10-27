package com.fleetops.repository;

import com.fleetops.model.Trip;
import com.fleetops.model.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByVehicleId(Long vehicleId);
    List<Trip> findByDriverId(Long driverId);
    List<Trip> findByStatus(TripStatus status);

    Optional<Trip> findByVehicleIdAndStatus(Long vehicleId, TripStatus status);
    Optional<Trip> findByDriverIdAndStatus(Long driverId, TripStatus status);

    @Query("SELECT COALESCE(SUM(t.distance), 0) FROM Trip t WHERE t.driver.id = :driverId AND t.status = com.fleetops.model.enums.TripStatus.COMPLETED")
    Double sumDistanceByDriver(@Param("driverId") Long driverId);

    @Query("SELECT COUNT(t) FROM Trip t WHERE t.driver.id = :driverId AND t.status = com.fleetops.model.enums.TripStatus.COMPLETED")
    long countCompletedByDriver(@Param("driverId") Long driverId);

    @Query("SELECT COALESCE(SUM(t.distance), 0) FROM Trip t WHERE t.vehicle.id = :vehicleId AND t.status = com.fleetops.model.enums.TripStatus.COMPLETED")
    Double sumDistanceByVehicle(@Param("vehicleId") Long vehicleId);

    @Query("SELECT COALESCE(SUM(t.fuelUsed), 0) FROM Trip t WHERE t.vehicle.id = :vehicleId AND t.status = com.fleetops.model.enums.TripStatus.COMPLETED")
    Double sumFuelByVehicle(@Param("vehicleId") Long vehicleId);
}
