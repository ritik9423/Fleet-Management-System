package com.fleetops.controller;

import com.fleetops.dto.request.VehicleRequest;
import com.fleetops.dto.request.VehicleStatusUpdateRequest;
import com.fleetops.dto.response.VehicleResponse;
import com.fleetops.service.VehicleService;
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
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicles", description = "Fleet vehicle management")
@SecurityRequirement(name = "Bearer Authentication")
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @Operation(summary = "List all vehicles (scoped to assigned vehicle if caller is DRIVER)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<List<VehicleResponse>> getAll(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            return ResponseEntity.ok(vehicleService.findByDriverUsername(authentication.getName()));
        }
        return ResponseEntity.ok(vehicleService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vehicle by ID (scoped to assigned vehicle if caller is DRIVER)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<VehicleResponse> getById(@PathVariable Long id, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            List<VehicleResponse> myVehicles = vehicleService.findByDriverUsername(authentication.getName());
            boolean match = myVehicles.stream().anyMatch(v -> v.getId().equals(id));
            if (!match) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
        }
        return ResponseEntity.ok(vehicleService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Register a new vehicle (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        return new ResponseEntity<>(vehicleService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update vehicle details (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VehicleResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update vehicle status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<VehicleResponse> updateStatus(@PathVariable Long id,
                                                         @Valid @RequestBody VehicleStatusUpdateRequest request) {
        return ResponseEntity.ok(vehicleService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete vehicle (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vehicleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
