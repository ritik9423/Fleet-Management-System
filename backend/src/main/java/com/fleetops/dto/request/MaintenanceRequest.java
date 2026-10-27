package com.fleetops.dto.request;

import com.fleetops.model.enums.MaintenanceType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MaintenanceRequest {
    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Maintenance type is required")
    private MaintenanceType type;

    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    private String notes;
}

