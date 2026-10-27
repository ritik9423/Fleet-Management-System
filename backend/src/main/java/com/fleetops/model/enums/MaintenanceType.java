package com.fleetops.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum MaintenanceType {
    OIL_CHANGE, TIRE_ROTATION, BRAKE_SERVICE, ENGINE_SERVICE, FULL_SERVICE, OTHER;

    @JsonCreator
    public static MaintenanceType fromString(String value) {
        if (value == null || value.isBlank()) return OTHER;
        return switch (value.trim().toUpperCase()) {
            case "BRAKE_INSPECTION" -> BRAKE_SERVICE;
            case "ENGINE_TUNEUP" -> ENGINE_SERVICE;
            case "ROUTINE_SERVICE" -> FULL_SERVICE;
            case "EMERGENCY_REPAIR" -> OTHER;
            default -> {
                try {
                    yield MaintenanceType.valueOf(value.trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    yield OTHER;
                }
            }
        };
    }
}
