package com.fleetops.service;

import com.fleetops.dto.request.VehicleRequest;
import com.fleetops.dto.request.VehicleStatusUpdateRequest;
import com.fleetops.dto.response.VehicleResponse;
import com.fleetops.exception.BusinessException;
import com.fleetops.exception.ResourceNotFoundException;
import com.fleetops.model.Driver;
import com.fleetops.model.Vehicle;
import com.fleetops.repository.DriverRepository;
import com.fleetops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    public List<VehicleResponse> findAll() {
        return vehicleRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<VehicleResponse> findByDriverUsername(String username) {
        return driverRepository.findByUsernameOrEmail(username)
                .map(Driver::getAssignedVehicle)
                .map(this::toResponse)
                .map(List::of)
                .orElse(List.of());
    }

    public VehicleResponse findById(Long id) {
        return toResponse(getVehicle(id));
    }

    @Transactional
    public VehicleResponse create(VehicleRequest request) {
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new BusinessException("License plate already registered: " + request.getLicensePlate());
        }
        if (vehicleRepository.existsByVin(request.getVin())) {
            throw new BusinessException("VIN already registered: " + request.getVin());
        }
        Vehicle vehicle = Vehicle.builder()
                .make(request.getMake())
                .model(request.getModel())
                .year(request.getYear())
                .licensePlate(request.getLicensePlate().toUpperCase())
                .vin(request.getVin().toUpperCase())
                .fuelCapacity(request.getFuelCapacity())
                .currentMileage(request.getCurrentMileage() != null ? request.getCurrentMileage() : BigDecimal.ZERO)
                .build();
        return toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request) {
        Vehicle vehicle = getVehicle(id);
        if (!vehicle.getLicensePlate().equals(request.getLicensePlate()) &&
                vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new BusinessException("License plate already registered: " + request.getLicensePlate());
        }
        vehicle.setMake(request.getMake());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setLicensePlate(request.getLicensePlate().toUpperCase());
        vehicle.setFuelCapacity(request.getFuelCapacity());
        if (request.getCurrentMileage() != null) {
            vehicle.setCurrentMileage(request.getCurrentMileage());
        }
        return toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional
    public VehicleResponse updateStatus(Long id, VehicleStatusUpdateRequest request) {
        Vehicle vehicle = getVehicle(id);
        vehicle.setStatus(request.getStatus());
        if (request.getCurrentMileage() != null) {
            vehicle.setCurrentMileage(request.getCurrentMileage());
        }
        return toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void delete(Long id) {
        Vehicle vehicle = getVehicle(id);
        Optional<Driver> assignedDriver = driverRepository.findByAssignedVehicle(vehicle);
        assignedDriver.ifPresent(d -> d.setAssignedVehicle(null));
        vehicleRepository.delete(vehicle);
    }

    Vehicle getVehicle(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
    }

    VehicleResponse toResponse(Vehicle v) {
        Optional<Driver> driver = driverRepository.findByAssignedVehicle(v);
        return VehicleResponse.builder()
                .id(v.getId())
                .make(v.getMake())
                .model(v.getModel())
                .year(v.getYear())
                .licensePlate(v.getLicensePlate())
                .vin(v.getVin())
                .status(v.getStatus())
                .currentMileage(v.getCurrentMileage())
                .fuelCapacity(v.getFuelCapacity())
                .assignedDriverId(driver.map(Driver::getId).orElse(null))
                .assignedDriverName(driver.map(Driver::getFullName).orElse(null))
                .createdAt(v.getCreatedAt())
                .build();
    }
}
