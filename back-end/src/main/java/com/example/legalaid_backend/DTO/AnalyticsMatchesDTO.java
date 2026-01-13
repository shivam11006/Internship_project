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
public class AnalyticsMatchesDTO {
    // Counts
    private Long totalMatches;
    private Long pendingMatches;
    private Long acceptedMatches;
    private Long rejectedMatches;
    
    // Status Distribution
    private Map<String, Long> matchesByStatus;
    
    // Quality Metrics
    private Double averageMatchScore;
    private Double highQualityMatchesPercentage; // Matches with score > 0.7
    private Double mediumQualityMatchesPercentage; // Matches with score 0.4-0.7
    private Double lowQualityMatchesPercentage; // Matches with score < 0.4
    
    // Geographic Data
    private Map<String, Long> matchesByLocation;
    private List<String> topMatchLocations;
    
    // Trends
    private List<AnalyticsTrendDTO> matchesGeneratedTrend; // Daily/Weekly/Monthly
    private List<AnalyticsTrendDTO> matchesAcceptedTrend;
    private List<AnalyticsTrendDTO> matchesRejectedTrend;
    
    // Acceptance Metrics
    private Double acceptanceRate; // Percentage of accepted matches
    private Double rejectionRate;
    private Double pendingRate;
    private Long averageTimeToAcceptance; // Days
    private Long averageTimeToRejection; // Days
    
    // Match Quality Over Time
    private List<AnalyticsTrendDTO> averageMatchScoreTrend;
    
    // Case to Match Ratio
    private Double matchRatioPerCase; // Average matches per case
    
    private String lastUpdated;
}
