package com.fleetops.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class DriverResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String licenseNumber;
    private LocalDate licenseExpiry;
    private Boolean active;
    private Long assignedVehicleId;
    private String assignedVehiclePlate;
    private String username;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getLicenseNumber() { return licenseNumber; }
    public LocalDate getLicenseExpiry() { return licenseExpiry; }
    public Boolean getActive() { return active; }
    public Long getAssignedVehicleId() { return assignedVehicleId; }
    public String getAssignedVehiclePlate() { return assignedVehiclePlate; }
    public String getUsername() { return username; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
