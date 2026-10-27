package com.fleetops.repository;

import com.fleetops.model.MaintenanceRecord;
import com.fleetops.model.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface MaintenanceRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByVehicleId(Long vehicleId);
    List<MaintenanceRecord> findByStatus(MaintenanceStatus status);

    @Query("SELECT m FROM MaintenanceRecord m WHERE m.status = com.fleetops.model.enums.MaintenanceStatus.SCHEDULED AND m.scheduledDate < :today")
    List<MaintenanceRecord> findOverdue(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(m.cost), 0) FROM MaintenanceRecord m WHERE m.vehicle.id = :vehicleId AND m.status = com.fleetops.model.enums.MaintenanceStatus.COMPLETED")
    Double sumCostByVehicle(@Param("vehicleId") Long vehicleId);

    @Query("SELECT m FROM MaintenanceRecord m WHERE m.scheduledDate BETWEEN :from AND :to AND m.status = com.fleetops.model.enums.MaintenanceStatus.SCHEDULED")
    List<MaintenanceRecord> findUpcoming(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
