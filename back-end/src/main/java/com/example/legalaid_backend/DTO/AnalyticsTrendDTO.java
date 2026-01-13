package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsTrendDTO {
    private String period; // Daily, Weekly, Monthly
    private LocalDateTime timestamp;
    private Long count;
    private Double percentageChange;
    private String trend; // "UP", "DOWN", "STABLE"
}
