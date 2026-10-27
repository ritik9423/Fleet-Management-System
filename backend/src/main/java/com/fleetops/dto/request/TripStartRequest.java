package com.fleetops.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TripStartRequest {
    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Driver ID is required")
    private Long driverId;

    @NotBlank(message = "Origin is required")
    @JsonAlias({"startLocation", "origin"})
    private String origin;

    @NotBlank(message = "Destination is required")
    @JsonAlias({"endLocation", "destination"})
    private String destination;

    @NotNull(message = "Start odometer is required")
    @DecimalMin(value = "0.0", message = "Odometer must be non-negative")
    @JsonAlias({"startMileage", "startOdometer"})
    private BigDecimal startOdometer;

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public BigDecimal getStartOdometer() { return startOdometer; }
    public void setStartOdometer(BigDecimal startOdometer) { this.startOdometer = startOdometer; }
}
