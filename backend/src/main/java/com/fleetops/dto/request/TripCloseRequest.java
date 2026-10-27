package com.fleetops.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TripCloseRequest {
    @NotNull(message = "End odometer is required")
    @DecimalMin(value = "0.0", message = "Odometer must be non-negative")
    @JsonAlias({"endMileage", "endOdometer"})
    private BigDecimal endOdometer;

    @DecimalMin(value = "0.0", message = "Fuel used must be non-negative")
    private BigDecimal fuelUsed;

    private String notes;
}
