package com.fleetops.service;

import com.fleetops.dto.request.TripCloseRequest;
import com.fleetops.dto.request.TripStartRequest;
import com.fleetops.dto.response.TripResponse;
import com.fleetops.exception.BusinessException;
import com.fleetops.exception.ResourceNotFoundException;
import com.fleetops.model.Driver;
import com.fleetops.model.Trip;
import com.fleetops.model.Vehicle;
import com.fleetops.model.enums.TripStatus;
import com.fleetops.model.enums.VehicleStatus;
import com.fleetops.repository.DriverRepository;
import com.fleetops.repository.TripRepository;
import com.fleetops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TripService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    public List<TripResponse> findAll() {
        return tripRepository.findAll().stream().map(this::toResponse).toList();
    }

    public TripResponse findById(Long id) {
        return toResponse(getTrip(id));
    }

    public List<TripResponse> findByVehicle(Long vehicleId) {
        return tripRepository.findByVehicleId(vehicleId).stream().map(this::toResponse).toList();
    }

    public List<TripResponse> findByDriver(Long driverId) {
        return tripRepository.findByDriverId(driverId).stream().map(this::toResponse).toList();
    }

    public List<TripResponse> findByCurrentDriver(String username) {
        Driver driver = driverRepository.findByUsernameOrEmail(username).orElse(null);
        if (driver == null) {
            return List.of();
        }
        return tripRepository.findByDriverId(driver.getId()).stream().map(this::toResponse).toList();
    }

    public boolean isTripOwnedByDriver(Long tripId, String username) {
        Trip trip = tripRepository.findById(tripId).orElse(null);
        if (trip == null) return false;
        Driver driver = driverRepository.findByUsernameOrEmail(username).orElse(null);
        if (driver == null) return false;
        return trip.getDriver() != null && trip.getDriver().getId().equals(driver.getId());
    }

    @Transactional
    public TripResponse start(TripStartRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.getVehicleId()));
        Driver driver = driverRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver", request.getDriverId()));

        if (!driver.getActive()) {
            throw new BusinessException("Driver is not active");
        }
        if (vehicle.getStatus() == VehicleStatus.MAINTENANCE || vehicle.getStatus() == VehicleStatus.RETIRED) {
            throw new BusinessException("Vehicle is not available for a trip (status: " + vehicle.getStatus() + ")");
        }
        tripRepository.findByVehicleIdAndStatus(vehicle.getId(), TripStatus.IN_PROGRESS).ifPresent(t -> {
            throw new BusinessException("Vehicle already has an active trip (trip ID: " + t.getId() + ")");
        });
        tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.IN_PROGRESS).ifPresent(t -> {
            throw new BusinessException("Driver already has an active trip (trip ID: " + t.getId() + ")");
        });

        Trip trip = Trip.builder()
                .vehicle(vehicle)
                .driver(driver)
                .origin(request.getOrigin())
                .destination(request.getDestination())
                .startOdometer(request.getStartOdometer())
                .startTime(LocalDateTime.now())
                .status(TripStatus.IN_PROGRESS)
                .build();

        vehicle.setStatus(VehicleStatus.ACTIVE);
        vehicleRepository.save(vehicle);

        return toResponse(tripRepository.save(trip));
    }

    @Transactional
    public TripResponse close(Long id, TripCloseRequest request) {
        Trip trip = getTrip(id);
        if (trip.getStatus() != TripStatus.IN_PROGRESS) {
            throw new BusinessException("Only in-progress trips can be closed");
        }
        if (request.getEndOdometer().compareTo(trip.getStartOdometer()) < 0) {
            throw new BusinessException("End odometer cannot be less than start odometer");
        }

        BigDecimal distance = request.getEndOdometer().subtract(trip.getStartOdometer());
        trip.setEndOdometer(request.getEndOdometer());
        trip.setFuelUsed(request.getFuelUsed());
        trip.setDistance(distance);
        trip.setEndTime(LocalDateTime.now());
        trip.setStatus(TripStatus.COMPLETED);
        trip.setNotes(request.getNotes());

        Vehicle vehicle = trip.getVehicle();
        vehicle.setCurrentMileage(request.getEndOdometer());
        vehicle.setStatus(VehicleStatus.IDLE);
        vehicleRepository.save(vehicle);

        return toResponse(tripRepository.save(trip));
    }

    @Transactional
    public TripResponse cancel(Long id) {
        Trip trip = getTrip(id);
        if (trip.getStatus() != TripStatus.IN_PROGRESS) {
            throw new BusinessException("Only in-progress trips can be cancelled");
        }
        trip.setStatus(TripStatus.CANCELLED);
        trip.setEndTime(LocalDateTime.now());

        Vehicle vehicle = trip.getVehicle();
        vehicle.setStatus(VehicleStatus.IDLE);
        vehicleRepository.save(vehicle);

        return toResponse(tripRepository.save(trip));
    }

    private Trip getTrip(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", id));
    }

    TripResponse toResponse(Trip t) {
        return TripResponse.builder()
                .id(t.getId())
                .vehicleId(t.getVehicle().getId())
                .vehiclePlate(t.getVehicle().getLicensePlate())
                .driverId(t.getDriver().getId())
                .driverName(t.getDriver().getFullName())
                .origin(t.getOrigin())
                .destination(t.getDestination())
                .startTime(t.getStartTime())
                .endTime(t.getEndTime())
                .startOdometer(t.getStartOdometer())
                .endOdometer(t.getEndOdometer())
                .fuelUsed(t.getFuelUsed())
                .distance(t.getDistance())
                .status(t.getStatus())
                .notes(t.getNotes())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
