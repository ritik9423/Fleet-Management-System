package com.fleetops.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum VehicleStatus {
    ACTIVE, IDLE, MAINTENANCE, RETIRED;

    @JsonCreator
    public static VehicleStatus fromString(String value) {
        if (value == null || value.isBlank()) return IDLE;
        return switch (value.trim().toUpperCase()) {
            case "AVAILABLE" -> IDLE;
            case "ON_TRIP" -> ACTIVE;
            case "OUT_OF_SERVICE" -> RETIRED;
            default -> {
                try {
                    yield VehicleStatus.valueOf(value.trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    yield IDLE;
                }
            }
        };
    }
}
