package com.fleetops.service;

import com.fleetops.dto.request.VehicleRequest;
import com.fleetops.dto.response.VehicleResponse;
import com.fleetops.exception.BusinessException;
import com.fleetops.exception.ResourceNotFoundException;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock VehicleRepository vehicleRepository;
    @Mock DriverRepository driverRepository;
    @InjectMocks VehicleService vehicleService;

    private Vehicle sampleVehicle;

    @BeforeEach
    void setup() {
        sampleVehicle = Vehicle.builder()
                .id(1L)
                .make("Ford")
                .model("Transit")
                .year(2022)
                .licensePlate("IL-TEST-01")
                .vin("1FTBW2CM5NKA00001")
                .status(VehicleStatus.IDLE)
                .currentMileage(BigDecimal.valueOf(1000))
                .fuelCapacity(BigDecimal.valueOf(60))
                .build();
    }

    @Test
    void findAll_returnsAllVehicles() {
        when(vehicleRepository.findAll()).thenReturn(List.of(sampleVehicle));
        when(driverRepository.findByAssignedVehicle(any())).thenReturn(Optional.empty());

        List<VehicleResponse> result = vehicleService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLicensePlate()).isEqualTo("IL-TEST-01");
    }

    @Test
    void findById_throwsWhenNotFound() {
        when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> vehicleService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_throwsOnDuplicateLicensePlate() {
        when(vehicleRepository.existsByLicensePlate("IL-TEST-01")).thenReturn(true);
        VehicleRequest request = new VehicleRequest();
        request.setMake("Ford");
        request.setModel("Transit");
        request.setYear(2022);
        request.setLicensePlate("IL-TEST-01");
        request.setVin("1FTBW2CM5NKA00001");
        request.setFuelCapacity(BigDecimal.valueOf(60));

        assertThatThrownBy(() -> vehicleService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("License plate already registered");
    }

    @Test
    void create_savesVehicleSuccessfully() {
        VehicleRequest request = new VehicleRequest();
        request.setMake("Ford");
        request.setModel("Transit");
        request.setYear(2022);
        request.setLicensePlate("IL-NEW-99");
        request.setVin("1FTBW2CM5NKA00099");
        request.setFuelCapacity(BigDecimal.valueOf(60));

        when(vehicleRepository.existsByLicensePlate("IL-NEW-99")).thenReturn(false);
        when(vehicleRepository.existsByVin("1FTBW2CM5NKA00099")).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(sampleVehicle);
        when(driverRepository.findByAssignedVehicle(any())).thenReturn(Optional.empty());

        VehicleResponse result = vehicleService.create(request);
        assertThat(result).isNotNull();
        verify(vehicleRepository).save(any(Vehicle.class));
    }
}
