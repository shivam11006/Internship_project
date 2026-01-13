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
public class AnalyticsCasesDTO {
    // Counts
    private Long totalCases;
    private Long openCases;
    private Long assignedCases;
    private Long closedCases;
    private Long pendingMatchCases;
    
    // Status Distribution
    private Map<String, Long> casesByStatus;
    private Map<String, Long> casesByPriority;
    private Map<String, Long> casesByType;
    
    // Geographic Data
    private Map<String, Long> casesByLocation;
    private List<String> topCaseLocations;
    
    // Expertise Tags
    private Map<String, Long> casesByExpertiseTag;
    private List<String> mostRequestedExpertiseTags;
    private List<String> leastRequestedExpertiseTags;
    
    // Trends
    private List<AnalyticsTrendDTO> casesCreatedTrend; // Daily/Weekly/Monthly
    private List<AnalyticsTrendDTO> casesClosedTrend;
    private List<AnalyticsTrendDTO> casesByPriorityTrend;
    
    // Time-based Statistics
    private Long averageCaseAge; // Days
    private Long medianCaseAge;
    private Long averageResolutionTime; // Days for closed cases
    
    private Double caseResolutionRate; // Percentage of closed vs total
    
    private String lastUpdated;
}
