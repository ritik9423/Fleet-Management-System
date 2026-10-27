package com.fleetops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveVehicleDto {
    private String deviceId;
    private String vehicleName;
    private String vehicleNumber;
    private String driverName;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Boolean ignitionOn;
    private String status;
    private Double battery;
    private Long timestamp;
    private String address;
}
