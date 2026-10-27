package com.fleetops.service;

import com.fleetops.dto.request.MaintenanceCompleteRequest;
import com.fleetops.dto.request.MaintenanceRequest;
import com.fleetops.dto.response.MaintenanceResponse;
import com.fleetops.exception.BusinessException;
import com.fleetops.exception.ResourceNotFoundException;
import com.fleetops.model.MaintenanceRecord;
import com.fleetops.model.Vehicle;
import com.fleetops.model.enums.MaintenanceStatus;
import com.fleetops.model.enums.VehicleStatus;
import com.fleetops.repository.MaintenanceRepository;
import com.fleetops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;

    public List<MaintenanceResponse> findAll() {
        return maintenanceRepository.findAll().stream().map(this::toResponse).toList();
    }

    public MaintenanceResponse findById(Long id) {
        return toResponse(getRecord(id));
    }

    public List<MaintenanceResponse> findByVehicle(Long vehicleId) {
        return maintenanceRepository.findByVehicleId(vehicleId).stream().map(this::toResponse).toList();
    }

    public List<MaintenanceResponse> findOverdue() {
        return maintenanceRepository.findOverdue(LocalDate.now()).stream().map(this::toResponse).toList();
    }

    public List<MaintenanceResponse> findUpcoming(int days) {
        return maintenanceRepository.findUpcoming(LocalDate.now(), LocalDate.now().plusDays(days))
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public MaintenanceResponse schedule(MaintenanceRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.getVehicleId()));
        MaintenanceRecord record = MaintenanceRecord.builder()
                .vehicle(vehicle)
                .type(request.getType())
                .scheduledDate(request.getScheduledDate())
                .notes(request.getNotes())
                .build();
        return toResponse(maintenanceRepository.save(record));
    }

    @Transactional
    public MaintenanceResponse complete(Long id, MaintenanceCompleteRequest request) {
        MaintenanceRecord record = getRecord(id);
        if (record.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new BusinessException("Maintenance record is already completed");
        }
        record.setStatus(MaintenanceStatus.COMPLETED);
        LocalDate completedDate = (request != null && request.getCompletedDate() != null)
                ? request.getCompletedDate()
                : LocalDate.now();
        record.setCompletedDate(completedDate);
        if (request != null && request.getCost() != null) {
            record.setCost(request.getCost());
        }
        if (request != null && request.getNotes() != null) {
            record.setNotes(request.getNotes());
        }
        Vehicle vehicle = record.getVehicle();
        if (vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
            vehicle.setStatus(VehicleStatus.IDLE);
            vehicleRepository.save(vehicle);
        }
        return toResponse(maintenanceRepository.save(record));
    }

    @Transactional
    public void delete(Long id) {
        MaintenanceRecord record = getRecord(id);
        if (record.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new BusinessException("Cannot delete a completed maintenance record");
        }
        maintenanceRepository.delete(record);
    }

    /** Runs every day at 06:00 — marks any scheduled records past their date as OVERDUE */
    @Scheduled(cron = "0 0 6 * * *")
    @Transactional
    public void flagOverdueRecords() {
        List<MaintenanceRecord> overdue = maintenanceRepository.findOverdue(LocalDate.now());
        if (overdue.isEmpty()) return;
        overdue.forEach(r -> {
            r.setStatus(MaintenanceStatus.OVERDUE);
            r.getVehicle().setStatus(VehicleStatus.MAINTENANCE);
        });
        maintenanceRepository.saveAll(overdue);
        log.info("Flagged {} maintenance record(s) as OVERDUE", overdue.size());
    }

    private MaintenanceRecord getRecord(Long id) {
        return maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenanceRecord", id));
    }

    MaintenanceResponse toResponse(MaintenanceRecord r) {
        return MaintenanceResponse.builder()
                .id(r.getId())
                .vehicleId(r.getVehicle().getId())
                .vehiclePlate(r.getVehicle().getLicensePlate())
                .type(r.getType())
                .status(r.getStatus())
                .scheduledDate(r.getScheduledDate())
                .completedDate(r.getCompletedDate())
                .cost(r.getCost())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
