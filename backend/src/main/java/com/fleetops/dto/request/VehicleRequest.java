package com.fleetops.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class VehicleRequest {
    @NotBlank(message = "Make is required")
    @Size(max = 50)
    private String make;

    @NotBlank(message = "Model is required")
    @Size(max = 50)
    private String model;

    @NotNull(message = "Year is required")
    @Min(value = 1990, message = "Year must be 1990 or later")
    @Max(value = 2100, message = "Year must be 2100 or earlier")
    private Integer year;

    @NotBlank(message = "License plate is required")
    @Size(max = 20)
    private String licensePlate;

    @NotBlank(message = "VIN is required")
    @Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    private String vin;

    @NotNull(message = "Fuel capacity is required")
    @DecimalMin(value = "1.0", message = "Fuel capacity must be positive")
    private BigDecimal fuelCapacity;

    private BigDecimal currentMileage;
}
