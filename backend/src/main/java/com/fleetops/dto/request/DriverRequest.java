package com.fleetops.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DriverRequest {
    @NotBlank(message = "First name is required")
    @Size(max = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone is required")
    @Size(max = 20)
    private String phone;

    @NotBlank(message = "License number is required")
    @Size(max = 30)
    private String licenseNumber;

    @NotNull(message = "License expiry is required")
    private LocalDate licenseExpiry;

    @Size(max = 50)
    private String username;

    @Size(max = 100)
    private String password;

    private Boolean active;
}
