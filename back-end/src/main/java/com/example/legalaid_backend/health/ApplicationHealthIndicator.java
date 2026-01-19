package com.example.legalaid_backend.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import com.sun.management.OperatingSystemMXBean;

/**
 * Custom Health Indicator for Application System Resources
 * Checks memory usage, CPU load, and JVM health
 */
@Component("applicationHealth")
public class ApplicationHealthIndicator implements HealthIndicator {

    private static final double CRITICAL_MEMORY_THRESHOLD = 0.90; // 90%
    private static final double CRITICAL_CPU_THRESHOLD = 0.85;    // 85%

    @Override
    public Health health() {
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        OperatingSystemMXBean osMXBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();

        long heapUsed = memoryMXBean.getHeapMemoryUsage().getUsed();
        long heapMax = memoryMXBean.getHeapMemoryUsage().getMax();
        double heapUsagePercent = (double) heapUsed / heapMax;

        double cpuLoad = osMXBean.getSystemLoadAverage();
        double cpuAvailable = osMXBean.getAvailableProcessors();

        if (cpuLoad < 0) {
            cpuLoad = osMXBean.getProcessCpuLoad() * cpuAvailable;
        }
        double cpuPercent = cpuLoad / cpuAvailable;

        if (heapUsagePercent > CRITICAL_MEMORY_THRESHOLD || cpuPercent > CRITICAL_CPU_THRESHOLD) {
            return Health.outOfService()
                    .withDetail("message", "Critical resource usage detected")
                    .withDetail("heapUsagePercent", String.format("%.2f%%", heapUsagePercent * 100))
                    .withDetail("cpuUsagePercent", String.format("%.2f%%", cpuPercent * 100))
                    .withDetail("heapUsedMB", heapUsed / (1024 * 1024))
                    .withDetail("heapMaxMB", heapMax / (1024 * 1024))
                    .build();
        }

        return Health.up()
                .withDetail("status", "Application running normally")
                .withDetail("heapUsagePercent", String.format("%.2f%%", heapUsagePercent * 100))
                .withDetail("cpuUsagePercent", String.format("%.2f%%", cpuPercent * 100))
                .withDetail("heapUsedMB", heapUsed / (1024 * 1024))
                .withDetail("heapMaxMB", heapMax / (1024 * 1024))
                .withDetail("availableProcessors", cpuAvailable)
                .build();
    }
}
