package com.fleetops.controller;

import com.fleetops.dto.request.TripCloseRequest;
import com.fleetops.dto.request.TripStartRequest;
import com.fleetops.dto.response.TripResponse;
import com.fleetops.service.TripService;
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
@RequestMapping("/api/trips")
@RequiredArgsConstructor
@Tag(name = "Trips", description = "Trip lifecycle management")
@SecurityRequirement(name = "Bearer Authentication")
public class TripController {

    private final TripService tripService;
    private final DriverService driverService;

    @GetMapping
    @Operation(summary = "List all trips (scoped to driver if caller is DRIVER)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<List<TripResponse>> getAll(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            return ResponseEntity.ok(tripService.findByCurrentDriver(authentication.getName()));
        }
        return ResponseEntity.ok(tripService.findAll());
    }

    @GetMapping("/my")
    @Operation(summary = "Get trips belonging to the authenticated driver")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<TripResponse>> getMyTrips(Authentication authentication) {
        return ResponseEntity.ok(tripService.findByCurrentDriver(authentication.getName()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get trip by ID (ownership verified for DRIVER)")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<TripResponse> getById(@PathVariable Long id, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            if (!tripService.isTripOwnedByDriver(id, authentication.getName())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
        }
        return ResponseEntity.ok(tripService.findById(id));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Operation(summary = "Get all trips for a vehicle")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<List<TripResponse>> getByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(tripService.findByVehicle(vehicleId));
    }

    @GetMapping("/driver/{driverId}")
    @Operation(summary = "Get all trips for a driver")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<List<TripResponse>> getByDriver(@PathVariable Long driverId, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            var me = driverService.findCurrentDriver(authentication.getName());
            if (me == null || !me.getId().equals(driverId)) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
        }
        return ResponseEntity.ok(tripService.findByDriver(driverId));
    }

    @PostMapping
    @Operation(summary = "Start a new trip")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<TripResponse> start(@Valid @RequestBody TripStartRequest request, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            var me = driverService.findCurrentDriver(authentication.getName());
            if (me == null || !me.getId().equals(request.getDriverId())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
        }
        return new ResponseEntity<>(tripService.start(request), HttpStatus.CREATED);
    }

    @RequestMapping(value = {"/{id}/close", "/{id}/complete"}, method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Operation(summary = "Close (complete) an in-progress trip")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'DRIVER')")
    public ResponseEntity<TripResponse> close(@PathVariable Long id,
                                               @Valid @RequestBody TripCloseRequest request,
                                               Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) {
            if (!tripService.isTripOwnedByDriver(id, authentication.getName())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
        }
        return ResponseEntity.ok(tripService.close(id, request));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an in-progress trip")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    public ResponseEntity<TripResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.cancel(id));
    }
}
