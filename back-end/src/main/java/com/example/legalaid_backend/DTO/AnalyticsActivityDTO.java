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
public class AnalyticsActivityDTO {
    // Overall Activity
    private Long totalAppointments;
    private Long upcomingAppointments; // Appointments scheduled in the future
    private Long appointmentsThisMonth;
    private Long appointmentsThisWeek;
    private Long appointmentsToday;
    
    // Appointment Status
    private Long completedAppointments;
    private Long cancelledAppointments;
    private Long rescheduleCount;
    
    // Chat Activity
    private Long totalChatMessages;
    private Long messagesThisMonth;
    private Long activeConversations;
    
    // Platform Usage Trends
    private List<AnalyticsTrendDTO> appointmentBookingTrend; // Daily/Weekly/Monthly
    private List<AnalyticsTrendDTO> chatActivityTrend;
    private List<AnalyticsTrendDTO> caseSubmissionTrend;
    
    // User Activity
    private Map<String, Long> activityByUserRole; // Messages/interactions by role
    private Double peakHourActivityPercentage;
    private List<String> peakActivityHours; // e.g., ["9-10", "14-15", "18-19"]
    
    // Geographic Activity
    private Map<String, Long> activityByLocation;
    private List<String> mostActiveLocations;
    
    // Response Times
    private Long averageResponseTime; // Minutes
    private Long averageCaseReviewTime; // Hours
    private Long averageMatchDecisionTime; // Hours
    
    // Engagement Metrics
    private Double lawyerEngagementRate; // Percentage of lawyers active
    private Double ngoEngagementRate; // Percentage of NGOs active
    private Double citizenEngagementRate; // Percentage of citizens active
    
    // Notifications Sent
    private Long totalNotificationsSent;
    private Long notificationsThisMonth;
    private Map<String, Long> notificationsByType; // MATCH_UPDATE, APPOINTMENT, MESSAGE, etc.
    
    private String lastUpdated;
}
