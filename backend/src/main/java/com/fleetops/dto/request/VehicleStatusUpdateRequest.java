package com.fleetops.dto.request;

import com.fleetops.model.enums.VehicleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class VehicleStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private VehicleStatus status;

    private BigDecimal currentMileage;
}
