package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogSearchRequest {
    private String level;           // Filter by log level (INFO, ERROR, WARN, etc.)
    private LocalDateTime startDate; // Filter by start date
    private LocalDateTime endDate;   // Filter by end date
    private String endpoint;        // Filter by endpoint
    private String username;        // Filter by username
    private String keyword;         // Search in message

    // Pagination
    private Integer page = 0;
    private Integer size = 50;

    // Sorting
    private String sortBy = "timestamp";
    private String sortOrder = "desc"; // Most recent first
}
