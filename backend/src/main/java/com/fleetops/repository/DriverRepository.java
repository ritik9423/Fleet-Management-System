package com.fleetops.repository;

import com.fleetops.model.Driver;
import com.fleetops.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    boolean existsByEmail(String email);
    boolean existsByLicenseNumber(String licenseNumber);
    List<Driver> findByActiveTrue();
    Optional<Driver> findByAssignedVehicle(Vehicle vehicle);
    Optional<Driver> findByEmail(String email);

    @Query("SELECT d FROM Driver d WHERE (d.user IS NOT NULL AND d.user.username = :username) OR d.email = :username")
    Optional<Driver> findByUsernameOrEmail(@Param("username") String username);
}
