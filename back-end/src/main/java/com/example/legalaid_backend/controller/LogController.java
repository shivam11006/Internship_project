package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.LogResponse;
import com.example.legalaid_backend.DTO.LogSearchRequest;
import com.example.legalaid_backend.DTO.LogStatsResponse;
import com.example.legalaid_backend.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')") // Only admins can access logs
public class LogController {
    private final LogService logService;

    /**
     * POST /api/admin/logs/search
     * Search logs with filters
     */
    @PostMapping("/search")
    public ResponseEntity<Page<LogResponse>> searchLogs(@RequestBody LogSearchRequest request) {
        return ResponseEntity.ok(logService.searchLogs(request));
    }

    /**
     * GET /api/admin/logs/stats
     * Get log statistics for dashboard
     */
    @GetMapping("/stats")
    public ResponseEntity<LogStatsResponse> getLogStats() {
        return ResponseEntity.ok(logService.getLogStats());
    }

    /**
     * GET /api/admin/logs/recent-errors
     * Get recent error logs
     */
    @GetMapping("/recent-errors")
    public ResponseEntity<List<LogResponse>> getRecentErrors(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(logService.getRecentErrors(limit));
    }

    /**
     * GET /api/admin/logs/{id}
     * Get specific log by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<LogResponse> getLogById(@PathVariable Long id) {
        return ResponseEntity.ok(logService.getLogById(id));
    }
}
