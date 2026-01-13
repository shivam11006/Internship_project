package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsOverviewDTO {
    private Long totalUsers;
    private Long totalCases;
    private Long totalMatches;
    private Long totalAppointments;
    
    private Long newUsersThisMonth;
    private Long newCasesThisMonth;
    private Long newMatchesThisMonth;
    
    private Map<String, Long> usersByRole; // LAWYER, NGO, CITIZEN, ADMIN
    private Map<String, Long> usersByApprovalStatus; // PENDING, APPROVED, REJECTED
    
    private Map<String, Long> casesByStatus; // OPEN, ASSIGNED, CLOSED, PENDING_MATCH
    private Map<String, Long> casesByPriority; // HIGH, MEDIUM, LOW
    
    private Map<String, Long> matchesByStatus; // PENDING, ACCEPTED, REJECTED
    
    private List<String> topExpertiseTags; // Most requested expertise areas
    
    private Double systemHealthScore; // 0-100 based on various metrics
    private String lastUpdated;
}
