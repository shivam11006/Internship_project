package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthResponse {

    private String status; // UP, DOWN, DEGRADED
    private LocalDateTime timestamp;
    private Map<String, ComponentHealth> components;
    private SystemMetrics metrics;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComponentHealth {
        private String status; // UP, DOWN
        private String details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemMetrics {
        private long totalMemory;
        private long freeMemory;
        private long usedMemory;
        private int availableProcessors;
        private long uptime;
        private double cpuUsage;
    }
}
