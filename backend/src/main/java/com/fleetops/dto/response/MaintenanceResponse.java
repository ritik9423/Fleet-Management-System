package com.fleetops.dto.response;

import com.fleetops.model.enums.MaintenanceStatus;
import com.fleetops.model.enums.MaintenanceType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class MaintenanceResponse {
    private Long id;
    private Long vehicleId;
    private String vehiclePlate;
    private MaintenanceType type;
    private MaintenanceStatus status;
    private LocalDate scheduledDate;
    private LocalDate completedDate;
    private BigDecimal cost;
    private String notes;
    private LocalDateTime createdAt;
}
