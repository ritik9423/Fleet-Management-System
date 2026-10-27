package com.fleetops.service;

import com.fleetops.dto.request.TripCloseRequest;
import com.fleetops.dto.request.TripStartRequest;
import com.fleetops.dto.response.TripResponse;
import com.fleetops.exception.BusinessException;
import com.fleetops.model.Driver;
import com.fleetops.model.Trip;
import com.fleetops.model.Vehicle;
import com.fleetops.model.enums.TripStatus;
import com.fleetops.model.enums.VehicleStatus;
import com.fleetops.repository.DriverRepository;
import com.fleetops.repository.TripRepository;
import com.fleetops.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock TripRepository tripRepository;
    @Mock VehicleRepository vehicleRepository;
    @Mock DriverRepository driverRepository;
    @InjectMocks TripService tripService;

    private Vehicle vehicle;
    private Driver driver;
    private Trip activeTrip;

    @BeforeEach
    void setup() {
        vehicle = Vehicle.builder()
                .id(1L).make("Ford").model("Transit").year(2022)
                .licensePlate("IL-TEST-01").vin("1FTBW2CM5NKA00001")
                .status(VehicleStatus.IDLE).currentMileage(BigDecimal.valueOf(1000))
                .fuelCapacity(BigDecimal.valueOf(60)).build();

        driver = Driver.builder()
                .id(1L).firstName("James").lastName("Rivera")
                .email("james@fleet.com").phone("312-555-0101")
                .licenseNumber("IL-D-001").licenseExpiry(LocalDate.now().plusYears(2))
                .active(true).build();

        activeTrip = Trip.builder()
                .id(1L).vehicle(vehicle).driver(driver)
                .origin("Chicago").destination("Evanston")
                .startOdometer(BigDecimal.valueOf(1000))
                .startTime(LocalDateTime.now().minusHours(1))
                .status(TripStatus.IN_PROGRESS).build();
    }

    @Test
    void start_failsIfVehicleInMaintenance() {
        vehicle.setStatus(VehicleStatus.MAINTENANCE);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));

        TripStartRequest req = new TripStartRequest();
        req.setVehicleId(1L); req.setDriverId(1L);
        req.setOrigin("Chicago"); req.setDestination("Evanston");
        req.setStartOdometer(BigDecimal.valueOf(1000));

        assertThatThrownBy(() -> tripService.start(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not available");
    }

    @Test
    void start_failsIfVehicleAlreadyOnTrip() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
        when(tripRepository.findByVehicleIdAndStatus(1L, TripStatus.IN_PROGRESS))
                .thenReturn(Optional.of(activeTrip));

        TripStartRequest req = new TripStartRequest();
        req.setVehicleId(1L); req.setDriverId(1L);
        req.setOrigin("Chicago"); req.setDestination("Evanston");
        req.setStartOdometer(BigDecimal.valueOf(1000));

        assertThatThrownBy(() -> tripService.start(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("active trip");
    }

    @Test
    void close_calculatesDistanceCorrectly() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(activeTrip));
        when(tripRepository.save(any())).thenReturn(activeTrip);
        when(vehicleRepository.save(any())).thenReturn(vehicle);

        TripCloseRequest req = new TripCloseRequest();
        req.setEndOdometer(BigDecimal.valueOf(1050));
        req.setFuelUsed(BigDecimal.valueOf(5.0));

        TripResponse response = tripService.close(1L, req);
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(TripStatus.COMPLETED);
        assertThat(activeTrip.getDistance()).isEqualByComparingTo(BigDecimal.valueOf(50));
        assertThat(activeTrip.getStatus()).isEqualTo(TripStatus.COMPLETED);
    }

    @Test
    void close_failsIfEndOdometerLessThanStart() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(activeTrip));

        TripCloseRequest req = new TripCloseRequest();
        req.setEndOdometer(BigDecimal.valueOf(500));

        assertThatThrownBy(() -> tripService.close(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("End odometer cannot be less");
    }

    @Test
    void cancel_setsVehicleToIdle() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(activeTrip));
        when(tripRepository.save(any())).thenReturn(activeTrip);
        when(vehicleRepository.save(any())).thenReturn(vehicle);

        tripService.cancel(1L);
        verify(vehicleRepository).save(argThat(v -> v.getStatus() == VehicleStatus.IDLE));
        assertThat(activeTrip.getStatus()).isEqualTo(TripStatus.CANCELLED);
    }
}
