package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.health.SystemHealthInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.metrics.MetricsEndpoint;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Admin Health Endpoints Controller
 * Provides comprehensive system health information
 * Accessible only to ADMIN users
 */
@RestController
@RequestMapping("/api/admin/health")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHealthController {

    private final HealthEndpoint healthEndpoint;
    private final MetricsEndpoint metricsEndpoint;

    /**
     * Get comprehensive system health status
     * Returns database, application, and JVM health information
     */
    @GetMapping("/status")
    public ResponseEntity<?> getSystemHealth() {
        var health = healthEndpoint.health();
        return ResponseEntity.ok(health);
    }

    /**
     * Get detailed health information with timestamp
     */
    @GetMapping("/detailed")
    public ResponseEntity<?> getDetailedHealth() {
        var health = healthEndpoint.healthForPath("*");
        return ResponseEntity.ok(health);
    }

    /**
     * Get all available metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        var metrics = metricsEndpoint.listNames();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get specific metric by name
     * Example: /api/admin/health/metrics/jvm.memory.used
     */
    @GetMapping("/metrics/{metricName}")
    public ResponseEntity<?> getMetricDetail(@PathVariable String metricName) {
        try {
            var metric = metricsEndpoint.metric(metricName, null);
            return ResponseEntity.ok(metric);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get database health status
     */
    @GetMapping("/database")
    public ResponseEntity<?> getDatabaseHealth() {
        var health = healthEndpoint.healthForPath("databaseHealth");
        return ResponseEntity.ok(health);
    }

    /**
     * Get application health status
     */
    @GetMapping("/application")
    public ResponseEntity<?> getApplicationHealth() {
        var health = healthEndpoint.healthForPath("applicationHealth");
        return ResponseEntity.ok(health);
    }

    /**
     * Health check endpoint (simple)
     * Returns 200 if application is running
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("System is operational");
    }

    /**
     * Get system information
     */
    @GetMapping("/info")
    public ResponseEntity<?> getSystemInfo() {
        return ResponseEntity.ok(new SystemInfo());
    }

    /**
     * Simple system info class
     */
    public static class SystemInfo {
        public String timestamp = LocalDateTime.now().toString();
        public String javaVersion = System.getProperty("java.version");
        public String osName = System.getProperty("os.name");
        public String osVersion = System.getProperty("os.version");
        public int processors = Runtime.getRuntime().availableProcessors();
        public long maxMemory = Runtime.getRuntime().maxMemory() / (1024 * 1024);
        public long totalMemory = Runtime.getRuntime().totalMemory() / (1024 * 1024);
        public long freeMemory = Runtime.getRuntime().freeMemory() / (1024 * 1024);
    }
}
