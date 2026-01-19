package com.example.legalaid_backend.health;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Data class representing comprehensive system health information
 * Used for health check responses and monitoring
 */
@Data
@Builder
public class SystemHealthInfo {
    private String status;
    private LocalDateTime timestamp;
    private DatabaseHealth database;
    private ApplicationHealth application;
    private String version;
    private String environment;

    @Data
    @Builder
    public static class DatabaseHealth {
        private String status;
        private String type;
        private boolean connectionValid;
    }

    @Data
    @Builder
    public static class ApplicationHealth {
        private String status;
        private String heapUsagePercent;
        private String cpuUsagePercent;
        private long heapUsedMB;
        private long heapMaxMB;
        private int availableProcessors;
    }
}
