package com.fleetops.service;

import com.fleetops.dto.request.DriverRequest;
import com.fleetops.dto.response.DriverResponse;
import com.fleetops.exception.BusinessException;
import com.fleetops.exception.ResourceNotFoundException;
import com.fleetops.model.Driver;
import com.fleetops.model.User;
import com.fleetops.model.Vehicle;
import com.fleetops.model.enums.Role;
import com.fleetops.model.enums.VehicleStatus;
import com.fleetops.repository.DriverRepository;
import com.fleetops.repository.TripRepository;
import com.fleetops.repository.UserRepository;
import com.fleetops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DriverService {

    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final PasswordEncoder passwordEncoder;

    public List<DriverResponse> findAll() {
        return driverRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<DriverResponse> findAllActive() {
        return driverRepository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public DriverResponse findById(Long id) {
        return toResponse(getDriver(id));
    }

    public DriverResponse findCurrentDriver(String username) {
        Driver driver = driverRepository.findByUsernameOrEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for user: " + username));
        return toResponse(driver);
    }

    @Transactional
    public DriverResponse create(DriverRequest request) {
        if (driverRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered: " + request.getEmail());
        }
        if (driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new BusinessException("License number already registered: " + request.getLicenseNumber());
        }

        // 1. Create Login User for Driver
        String rawUsername = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername().trim()
                : request.getEmail().split("@")[0].toLowerCase().trim();

        if (userRepository.existsByUsername(rawUsername)) {
            rawUsername = rawUsername + "_" + (System.currentTimeMillis() % 1000);
        }

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword().trim()
                : "password";

        User driverUser = User.builder()
                .username(rawUsername)
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.DRIVER)
                .build();
        User savedUser = userRepository.save(driverUser);

        // 2. Create and link Driver
        Driver driver = Driver.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .licenseNumber(request.getLicenseNumber())
                .licenseExpiry(request.getLicenseExpiry())
                .user(savedUser)
                .build();
        return toResponse(driverRepository.save(driver));
    }

    @Transactional
    public DriverResponse update(Long id, DriverRequest request) {
        Driver driver = getDriver(id);
        if (!driver.getEmail().equals(request.getEmail()) && driverRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered: " + request.getEmail());
        }
        driver.setFirstName(request.getFirstName());
        driver.setLastName(request.getLastName());
        driver.setEmail(request.getEmail());
        driver.setPhone(request.getPhone());
        driver.setLicenseNumber(request.getLicenseNumber());
        driver.setLicenseExpiry(request.getLicenseExpiry());
        if (request.getActive() != null) {
            driver.setActive(request.getActive());
            if (!request.getActive() && driver.getAssignedVehicle() != null) {
                Vehicle vehicle = driver.getAssignedVehicle();
                driver.setAssignedVehicle(null);
                vehicle.setStatus(VehicleStatus.IDLE);
                vehicleRepository.save(vehicle);
            }
        }

        // Update linked User login credentials (username & password)
        User user = driver.getUser();
        if (user == null) {
            String uname = (request.getUsername() != null && !request.getUsername().isBlank())
                    ? request.getUsername().trim()
                    : request.getEmail().split("@")[0].toLowerCase().trim();
            if (userRepository.existsByUsername(uname)) {
                uname = uname + "_" + (System.currentTimeMillis() % 1000);
            }
            String rawPwd = (request.getPassword() != null && !request.getPassword().isBlank())
                    ? request.getPassword().trim()
                    : "password";
            User newUser = User.builder()
                    .username(uname)
                    .email(request.getEmail().trim())
                    .password(passwordEncoder.encode(rawPwd))
                    .role(Role.DRIVER)
                    .build();
            user = userRepository.save(newUser);
            driver.setUser(user);
        } else {
            user.setEmail(request.getEmail().trim());
            if (request.getUsername() != null && !request.getUsername().isBlank()) {
                String newUsername = request.getUsername().trim();
                if (!user.getUsername().equalsIgnoreCase(newUsername) && userRepository.existsByUsername(newUsername)) {
                    throw new BusinessException("Username already taken: " + newUsername);
                }
                user.setUsername(newUsername);
            }
            if (request.getPassword() != null && !request.getPassword().isBlank()) {
                if (request.getPassword().trim().length() < 4) {
                    throw new BusinessException("Password must be at least 4 characters");
                }
                user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
            }
            userRepository.save(user);
        }

        return toResponse(driverRepository.save(driver));
    }

    @Transactional
    public DriverResponse assignVehicle(Long driverId, Long vehicleId) {
        Driver driver = getDriver(driverId);
        if (!driver.getActive()) {
            throw new BusinessException("Cannot assign vehicle to an inactive driver");
        }
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
        if (vehicle.getStatus() == VehicleStatus.RETIRED) {
            throw new BusinessException("Cannot assign a retired vehicle");
        }
        Optional<Driver> currentOccupant = driverRepository.findByAssignedVehicle(vehicle);
        currentOccupant.ifPresent(d -> d.setAssignedVehicle(null));
        if (driver.getAssignedVehicle() != null) {
            driver.setAssignedVehicle(null);
        }
        driver.setAssignedVehicle(vehicle);
        vehicle.setStatus(VehicleStatus.ACTIVE);
        vehicleRepository.save(vehicle);
        return toResponse(driverRepository.save(driver));
    }

    @Transactional
    public DriverResponse unassignVehicle(Long driverId) {
        Driver driver = getDriver(driverId);
        if (driver.getAssignedVehicle() == null) {
            throw new BusinessException("Driver has no assigned vehicle");
        }
        Vehicle vehicle = driver.getAssignedVehicle();
        driver.setAssignedVehicle(null);
        vehicle.setStatus(VehicleStatus.IDLE);
        vehicleRepository.save(vehicle);
        return toResponse(driverRepository.save(driver));
    }

    @Transactional
    public void delete(Long id) {
        Driver driver = getDriver(id);
        if (driver.getAssignedVehicle() != null) {
            Vehicle vehicle = driver.getAssignedVehicle();
            driver.setAssignedVehicle(null);
            vehicle.setStatus(VehicleStatus.IDLE);
            vehicleRepository.save(vehicle);
        }
        var trips = tripRepository.findByDriverId(id);
        if (trips == null || trips.isEmpty()) {
            User user = driver.getUser();
            driverRepository.delete(driver);
            if (user != null) {
                userRepository.delete(user);
            }
        } else {
            driver.setActive(false);
            driverRepository.save(driver);
        }
    }

    @Transactional
    public void deactivate(Long id) {
        delete(id);
    }

    Driver getDriver(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));
    }

    DriverResponse toResponse(Driver d) {
        String uname = d.getUser() != null ? d.getUser().getUsername() : (d.getEmail() != null ? d.getEmail().split("@")[0] : null);
        return DriverResponse.builder()
                .id(d.getId())
                .firstName(d.getFirstName())
                .lastName(d.getLastName())
                .email(d.getEmail())
                .phone(d.getPhone())
                .licenseNumber(d.getLicenseNumber())
                .licenseExpiry(d.getLicenseExpiry())
                .active(d.getActive())
                .assignedVehicleId(d.getAssignedVehicle() != null ? d.getAssignedVehicle().getId() : null)
                .assignedVehiclePlate(d.getAssignedVehicle() != null ? d.getAssignedVehicle().getLicensePlate() : null)
                .username(uname)
                .createdAt(d.getCreatedAt())
                .build();
    }
}
