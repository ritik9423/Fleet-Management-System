package com.fleetops.dto.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MaintenanceCompleteRequest {
    private LocalDate completedDate;

    @DecimalMin(value = "0.0", message = "Cost must be non-negative")
    private BigDecimal cost;

    private String notes;
}
