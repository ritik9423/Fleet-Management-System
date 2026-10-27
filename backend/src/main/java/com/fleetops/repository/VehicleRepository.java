package com.fleetops.repository;

import com.fleetops.model.Vehicle;
import com.fleetops.model.enums.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    boolean existsByLicensePlate(String licensePlate);
    boolean existsByVin(String vin);
    List<Vehicle> findByStatus(VehicleStatus status);

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.status != com.fleetops.model.enums.VehicleStatus.RETIRED")
    long countActive();

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.status = com.fleetops.model.enums.VehicleStatus.ACTIVE")
    long countInUse();
}
