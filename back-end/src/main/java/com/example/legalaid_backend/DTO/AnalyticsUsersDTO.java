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
public class AnalyticsUsersDTO {
    // Counts
    private Long totalUsers;
    private Long totalLawyers;
    private Long totalNgos;
    private Long totalCitizens;
    
    // Status Breakdown
    private Long pendingApprovals;
    private Long approvedUsers;
    private Long rejectedUsers;
    private Long reapprovalPendingUsers;
    
    // Geographic Data
    private Map<String, Long> usersByLocation;
    private List<String> topLocations;
    
    // Trends
    private List<AnalyticsTrendDTO> userGrowthTrend; // Daily/Weekly/Monthly
    private List<AnalyticsTrendDTO> lawyerGrowthTrend;
    private List<AnalyticsTrendDTO> ngoGrowthTrend;
    
    // Activation Metrics
    private Long activeUsersThisMonth;
    private Long activeUsersThisWeek;
    private Long activeUsersToday;
    private Double userRetentionRate; // Percentage
    private Double averageUserLifetime; // Days
    
    // Approval Statistics
    private Double approvalRate; // Percentage of approved vs total
    private Double rejectionRate;
    private Long averageApprovalTime; // In days
    
    private String lastUpdated;
}
