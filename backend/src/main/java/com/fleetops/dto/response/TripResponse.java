package com.fleetops.dto.response;

import com.fleetops.model.enums.TripStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TripResponse {
    private Long id;
    private Long vehicleId;
    private String vehiclePlate;
    private Long driverId;
    private String driverName;
    private String origin;
    private String destination;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal startOdometer;
    private BigDecimal endOdometer;
    private BigDecimal fuelUsed;
    private BigDecimal distance;
    private TripStatus status;
    private String notes;
    private LocalDateTime createdAt;
}
