package com.fleetops.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDutyLocationRequest {
    private String driverUsername;
    private String driverName;
    private String vehiclePlate;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double heading;
    private Double accuracy;
    private Double batteryLevel;
    private String status; // "ON_DUTY", "DRIVING", "STOPPED", "OFF_DUTY"
    private String notes;

    public String getDriverUsername() { return driverUsername; }
    public String getDriverName() { return driverName; }
    public String getVehiclePlate() { return vehiclePlate; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public Double getSpeed() { return speed; }
    public Double getHeading() { return heading; }
    public Double getAccuracy() { return accuracy; }
    public Double getBatteryLevel() { return batteryLevel; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
}
