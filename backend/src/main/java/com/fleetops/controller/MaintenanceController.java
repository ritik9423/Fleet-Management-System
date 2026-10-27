package com.fleetops.controller;

import com.fleetops.dto.request.MaintenanceCompleteRequest;
import com.fleetops.dto.request.MaintenanceRequest;
import com.fleetops.dto.response.MaintenanceResponse;
import com.fleetops.service.MaintenanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@Tag(name = "Maintenance", description = "Vehicle maintenance scheduling and tracking")
@SecurityRequirement(name = "Bearer Authentication")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping
    @Operation(summary = "List all maintenance records")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<List<MaintenanceResponse>> getAll() {
        return ResponseEntity.ok(maintenanceService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get maintenance record by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<MaintenanceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.findById(id));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Operation(summary = "Get all maintenance records for a vehicle")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<List<MaintenanceResponse>> getByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.findByVehicle(vehicleId));
    }

    @GetMapping("/overdue")
    @Operation(summary = "List all overdue maintenance records")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<List<MaintenanceResponse>> getOverdue() {
        return ResponseEntity.ok(maintenanceService.findOverdue());
    }

    @GetMapping("/upcoming")
    @Operation(summary = "List maintenance scheduled in the next N days (default 7)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<List<MaintenanceResponse>> getUpcoming(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(maintenanceService.findUpcoming(days));
    }

    @PostMapping
    @Operation(summary = "Schedule maintenance for a vehicle")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<MaintenanceResponse> schedule(@Valid @RequestBody MaintenanceRequest request) {
        return new ResponseEntity<>(maintenanceService.schedule(request), HttpStatus.CREATED);
    }

    @RequestMapping(value = "/{id}/complete", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Operation(summary = "Mark a maintenance record as completed")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<MaintenanceResponse> complete(@PathVariable Long id,
                                                         @RequestBody(required = false) MaintenanceCompleteRequest request) {
        return ResponseEntity.ok(maintenanceService.complete(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a pending maintenance record (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        maintenanceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
