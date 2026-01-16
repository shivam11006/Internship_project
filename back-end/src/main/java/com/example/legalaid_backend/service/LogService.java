package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.LogResponse;
import com.example.legalaid_backend.DTO.LogSearchRequest;
import com.example.legalaid_backend.DTO.LogStatsResponse;
import com.example.legalaid_backend.entity.ApplicationLog;
import com.example.legalaid_backend.repository.ApplicationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LogService {
    private final ApplicationLogRepository logRepository;

    /**
     * Search logs with filters and pagination
     */
    public Page<LogResponse> searchLogs(LogSearchRequest request) {
        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(request.getSortOrder())
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC,
                request.getSortBy()
        );

        PageRequest pageRequest = PageRequest.of(
                request.getPage(),
                request.getSize(),
                sort
        );

        Page<ApplicationLog> logs;

        // Apply filters based on request
        if (request.getLevel() != null && request.getStartDate() != null && request.getEndDate() != null) {
            // Filter by level and date range
            logs = logRepository.findByLevelAndTimestampBetween(
                    request.getLevel(),
                    request.getStartDate(),
                    request.getEndDate(),
                    pageRequest
            );
        } else if (request.getStartDate() != null && request.getEndDate() != null) {
            // Filter by date range only
            logs = logRepository.findByTimestampBetween(
                    request.getStartDate(),
                    request.getEndDate(),
                    pageRequest
            );
        } else if (request.getLevel() != null) {
            // Filter by level only
            logs = logRepository.findByLevel(request.getLevel(), pageRequest);
        } else if (request.getEndpoint() != null) {
            // Filter by endpoint
            logs = logRepository.findByEndpointContaining(request.getEndpoint(), pageRequest);
        } else if (request.getUsername() != null) {
            // Filter by username
            logs = logRepository.findByUsernameContaining(request.getUsername(), pageRequest);
        } else {
            // No filters - get all logs
            logs = logRepository.findAll(pageRequest);
        }

        // Convert to DTO
        return logs.map(this::convertToLogResponse);
    }

    /**
     * Get log statistics for dashboard
     */
    public LogStatsResponse getLogStats() {
        long total = logRepository.count();
        long errors = logRepository.countByLevel("ERROR");
        long warnings = logRepository.countByLevel("WARN");
        long info = logRepository.countByLevel("INFO");
        long debug = logRepository.countByLevel("DEBUG");

        return new LogStatsResponse(total, errors, warnings, info, debug);
    }

    /**
     * Get recent error logs (for quick admin view)
     */
    public List<LogResponse> getRecentErrors(int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit);
        List<ApplicationLog> errors = logRepository.findRecentErrors(pageRequest);

        return errors.stream()
                .map(this::convertToLogResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get log by ID
     */
    public LogResponse getLogById(Long id) {
        ApplicationLog log = logRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log not found"));
        return convertToLogResponse(log);
    }

    /**
     * Delete old logs (for maintenance)
     * Uses native SQL DELETE query for better performance
     */
    public long deleteLogsOlderThan(LocalDateTime date) {
        try {
            if (date == null) {
                throw new RuntimeException("Date parameter cannot be null");
            }
            int deletedCount = logRepository.deleteByTimestampBefore(date);
            return (long) deletedCount;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete old logs: " + e.getMessage(), e);
        }
    }

    /**
     * Get total count of logs
     */
    public long getLogCount() {
        return logRepository.count();
    }

    // ==================== CONVERSION METHOD ====================

    private LogResponse convertToLogResponse(ApplicationLog log) {
        LogResponse response = new LogResponse();
        response.setId(log.getId());
        response.setTimestamp(log.getTimestamp());
        response.setLevel(log.getLevel());
        response.setLogger(log.getLogger());
        response.setMessage(log.getMessage());
        response.setThreadName(log.getThreadName());
        response.setException(log.getException());
        response.setUsername(log.getUsername());
        response.setEndpoint(log.getEndpoint());
        return response;
    }
}
