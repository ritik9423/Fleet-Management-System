package com.fleetops.service;


import com.fleetops.dto.request.DriverRequest;
import com.fleetops.dto.response.DriverResponse;
import com.fleetops.exception.BusinessException;
import com.fleetops.exception.ResourceNotFoundException;
import com.fleetops.model.Driver;
import com.fleetops.model.Vehicle;
import com.fleetops.model.enums.VehicleStatus;
import com.fleetops.repository.DriverRepository;
import com.fleetops.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriverServiceTest {

    @Mock DriverRepository driverRepository;
    @Mock VehicleRepository vehicleRepository;
    @InjectMocks DriverService driverService;

    private Driver sampleDriver;
    private Vehicle sampleVehicle;

    @BeforeEach
    void setup() {
        sampleVehicle = Vehicle.builder()
                .id(1L).make("Ford").model("Transit").year(2022)
                .licensePlate("IL-TEST-01").vin("1FTBW2CM5NKA00001")
                .status(VehicleStatus.IDLE).currentMileage(BigDecimal.ZERO)
                .fuelCapacity(BigDecimal.valueOf(60)).build();

        sampleDriver = Driver.builder()
                .id(1L).firstName("James").lastName("Rivera")
                .email("james@fleet.com").phone("312-555-0101")
                .licenseNumber("IL-D-001").licenseExpiry(LocalDate.now().plusYears(2))
                .active(true).build();
    }

    @Test
    void findById_throwsWhenNotFound() {
        when(driverRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> driverService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_throwsOnDuplicateEmail() {
        when(driverRepository.existsByEmail("james@fleet.com")).thenReturn(true);
        DriverRequest request = new DriverRequest();
        request.setFirstName("James"); request.setLastName("Rivera");
        request.setEmail("james@fleet.com"); request.setPhone("312-555-0101");
        request.setLicenseNumber("IL-D-001");
        request.setLicenseExpiry(LocalDate.now().plusYears(2));

        assertThatThrownBy(() -> driverService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    void assignVehicle_failsForInactiveDriver() {
        sampleDriver.setActive(false);
        when(driverRepository.findById(1L)).thenReturn(Optional.of(sampleDriver));

        assertThatThrownBy(() -> driverService.assignVehicle(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactive");
    }

    @Test
    void assignVehicle_succeeds() {
        when(driverRepository.findById(1L)).thenReturn(Optional.of(sampleDriver));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));
        when(driverRepository.findByAssignedVehicle(sampleVehicle)).thenReturn(Optional.empty());
        when(driverRepository.save(any())).thenReturn(sampleDriver);
        when(vehicleRepository.save(any())).thenReturn(sampleVehicle);

        DriverResponse response = driverService.assignVehicle(1L, 1L);
        assertThat(response).isNotNull();
        verify(vehicleRepository).save(argThat(v -> v.getStatus() == VehicleStatus.ACTIVE));
    }

    @Test
    void unassignVehicle_failsWhenNoVehicle() {
        when(driverRepository.findById(1L)).thenReturn(Optional.of(sampleDriver));
        assertThatThrownBy(() -> driverService.unassignVehicle(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no assigned vehicle");
    }
}
