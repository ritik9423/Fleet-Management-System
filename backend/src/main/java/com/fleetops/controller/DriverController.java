package com.fleetops.controller;

import com.fleetops.dto.request.DriverRequest;
import com.fleetops.dto.response.DriverResponse;
import com.fleetops.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@Tag(name = "Drivers", description = "Driver management and vehicle assignment")
@SecurityRequirement(name = "Bearer Authentication")
public class DriverController {

    private final DriverService driverService;

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated driver profile")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverResponse> getCurrentDriver(Authentication authentication) {
        return ResponseEntity.ok(driverService.findCurrentDriver(authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "List all drivers (scoped to driver if caller is DRIVER)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<List<DriverResponse>> getAll(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            DriverResponse me = driverService.findCurrentDriver(authentication.getName());
            return ResponseEntity.ok(me != null ? List.of(me) : List.of());
        }
        return ResponseEntity.ok(driverService.findAll());
    }

    @GetMapping("/active")
    @Operation(summary = "List active drivers only (scoped to driver if caller is DRIVER)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<List<DriverResponse>> getActive(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            DriverResponse me = driverService.findCurrentDriver(authentication.getName());
            return ResponseEntity.ok(me != null && Boolean.TRUE.equals(me.getActive()) ? List.of(me) : List.of());
        }
        return ResponseEntity.ok(driverService.findAllActive());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get driver by ID (caller verified if DRIVER)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<DriverResponse> getById(@PathVariable Long id, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            DriverResponse me = driverService.findCurrentDriver(authentication.getName());
            if (me == null || !me.getId().equals(id)) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
        }
        return ResponseEntity.ok(driverService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new driver (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DriverResponse> create(@Valid @RequestBody DriverRequest request) {
        return new ResponseEntity<>(driverService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update driver details (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DriverResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody DriverRequest request) {
        return ResponseEntity.ok(driverService.update(id, request));
    }

    @PatchMapping("/{id}/assign/{vehicleId}")
    @Operation(summary = "Assign a vehicle to a driver")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<DriverResponse> assignVehicle(@PathVariable Long id,
                                                         @PathVariable Long vehicleId) {
        return ResponseEntity.ok(driverService.assignVehicle(id, vehicleId));
    }

    @PatchMapping("/{id}/unassign")
    @Operation(summary = "Remove vehicle assignment from driver")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<DriverResponse> unassignVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(driverService.unassignVehicle(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a driver (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        driverService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
