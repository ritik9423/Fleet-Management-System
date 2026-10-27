package com.fleetops.dto.response;

import com.fleetops.model.enums.VehicleStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class VehicleResponse {
    private Long id;
    private String make;
    private String model;
    private Integer year;
    private String licensePlate;
    private String vin;
    private VehicleStatus status;
    private BigDecimal currentMileage;
    private BigDecimal fuelCapacity;
    private String assignedDriverName;
    private Long assignedDriverId;
    private LocalDateTime createdAt;
}
