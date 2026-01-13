package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.entity.*;
import com.example.legalaid_backend.repository.*;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import com.example.legalaid_backend.util.MatchStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);

    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final MatchRepository matchRepository;
    private final AppointmentRepository appointmentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final NotificationRepository notificationRepository;
    private final ApplicationLogRepository applicationLogRepository;

    // ==================== OVERVIEW ANALYTICS ====================
    public AnalyticsOverviewDTO getOverviewAnalytics() {
        logger.info("Generating overview analytics");

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);

        long totalUsers = userRepository.count();
        long totalCases = caseRepository.count();
        long totalMatches = matchRepository.count();
        long totalAppointments = appointmentRepository.count();

        // Users created this month
        List<User> usersThisMonth = userRepository.findAll().stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(oneMonthAgo))
                .collect(Collectors.toList());

        // Cases created this month
        List<Case> casesThisMonth = caseRepository.findAll().stream()
                .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(oneMonthAgo))
                .collect(Collectors.toList());

        // Matches created this month
        List<Match> matchesThisMonth = matchRepository.findAll().stream()
                .filter(m -> m.getCreatedAt() != null && m.getCreatedAt().isAfter(oneMonthAgo))
                .collect(Collectors.toList());

        // Users by role
        Map<String, Long> usersByRole = new HashMap<>();
        usersByRole.put("LAWYER", userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.LAWYER).count());
        usersByRole.put("NGO", userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.NGO).count());
        usersByRole.put("CITIZEN", userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CITIZEN).count());
        usersByRole.put("ADMIN", userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN).count());

        // Users by approval status
        Map<String, Long> usersByApprovalStatus = new HashMap<>();
        usersByApprovalStatus.put("PENDING", (long) userRepository.findByApprovalStatusIn(
                List.of(ApprovalStatus.PENDING)).size());
        usersByApprovalStatus.put("APPROVED", (long) userRepository.findByApprovalStatusIn(
                List.of(ApprovalStatus.APPROVED)).size());
        usersByApprovalStatus.put("REJECTED", (long) userRepository.findByApprovalStatusIn(
                List.of(ApprovalStatus.REJECTED)).size());

        // Cases by status
        Map<String, Long> casesByStatus = new HashMap<>();
        List<Case> allCases = caseRepository.findAll();
        casesByStatus.put("OPEN", allCases.stream().filter(c -> "OPEN".equals(c.getStatus())).count());
        casesByStatus.put("ASSIGNED", allCases.stream().filter(c -> "ASSIGNED".equals(c.getStatus())).count());
        casesByStatus.put("CLOSED", allCases.stream().filter(c -> "CLOSED".equals(c.getStatus())).count());

        // Cases by priority
        Map<String, Long> casesByPriority = new HashMap<>();
        casesByPriority.put("HIGH", allCases.stream().filter(c -> "HIGH".equals(c.getPriority())).count());
        casesByPriority.put("MEDIUM", allCases.stream().filter(c -> "MEDIUM".equals(c.getPriority())).count());
        casesByPriority.put("LOW", allCases.stream().filter(c -> "LOW".equals(c.getPriority())).count());

        // Matches by status
        Map<String, Long> matchesByStatus = new HashMap<>();
        List<Match> allMatches = matchRepository.findAll();
        matchesByStatus.put("PENDING", allMatches.stream().filter(m -> m.getStatus() == MatchStatus.PENDING).count());
        matchesByStatus.put("ACCEPTED_BY_PROVIDER", allMatches.stream().filter(m -> m.getStatus() == MatchStatus.ACCEPTED_BY_PROVIDER).count());
        matchesByStatus.put("REJECTED_BY_CITIZEN", allMatches.stream().filter(m -> m.getStatus() == MatchStatus.REJECTED_BY_CITIZEN).count());
        matchesByStatus.put("REJECTED_BY_PROVIDER", allMatches.stream().filter(m -> m.getStatus() == MatchStatus.REJECTED_BY_PROVIDER).count());

        // Top expertise tags
        List<String> topExpertiseTags = allCases.stream()
                .flatMap(c -> c.getExpertiseTags() != null ? c.getExpertiseTags().stream() : Stream.empty())
                .filter(tag -> tag != null && !tag.isEmpty())
                .collect(Collectors.groupingBy(String::toString, Collectors.counting()))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // System health score (0-100)
        double healthScore = calculateSystemHealthScore(totalUsers, totalCases, totalMatches);

        return AnalyticsOverviewDTO.builder()
                .totalUsers(totalUsers)
                .totalCases(totalCases)
                .totalMatches(totalMatches)
                .totalAppointments(totalAppointments)
                .newUsersThisMonth((long) usersThisMonth.size())
                .newCasesThisMonth((long) casesThisMonth.size())
                .newMatchesThisMonth((long) matchesThisMonth.size())
                .usersByRole(usersByRole)
                .usersByApprovalStatus(usersByApprovalStatus)
                .casesByStatus(casesByStatus)
                .casesByPriority(casesByPriority)
                .matchesByStatus(matchesByStatus)
                .topExpertiseTags(topExpertiseTags)
                .systemHealthScore(healthScore)
                .lastUpdated(LocalDateTime.now().toString())
                .build();
    }

    // ==================== USERS ANALYTICS ====================
    public AnalyticsUsersDTO getUsersAnalytics() {
        logger.info("Generating users analytics");

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);

        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();

        long totalLawyers = allUsers.stream().filter(u -> u.getRole() == Role.LAWYER).count();
        long totalNgos = allUsers.stream().filter(u -> u.getRole() == Role.NGO).count();
        long totalCitizens = allUsers.stream().filter(u -> u.getRole() == Role.CITIZEN).count();

        // Approval status
        long pendingApprovals = allUsers.stream().filter(u -> u.getApprovalStatus() == ApprovalStatus.PENDING).count();
        long approvedUsers = allUsers.stream().filter(u -> u.getApprovalStatus() == ApprovalStatus.APPROVED).count();
        long rejectedUsers = allUsers.stream().filter(u -> u.getApprovalStatus() == ApprovalStatus.REJECTED).count();
        long reapprovalPendingUsers = allUsers.stream().filter(u -> u.getApprovalStatus() == ApprovalStatus.REAPPROVAL_PENDING).count();

        // Geographic data
        Map<String, Long> usersByLocation = allUsers.stream()
                .filter(u -> u.getLocation() != null && !u.getLocation().isEmpty())
                .collect(Collectors.groupingBy(User::getLocation, Collectors.counting()));

        List<String> topLocations = usersByLocation.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Growth trends
        List<AnalyticsTrendDTO> userGrowthTrend = generateMonthlyTrends(allUsers, User::getCreatedAt);
        List<AnalyticsTrendDTO> lawyerGrowthTrend = generateMonthlyTrends(
                allUsers.stream().filter(u -> u.getRole() == Role.LAWYER).collect(Collectors.toList()),
                User::getCreatedAt
        );
        List<AnalyticsTrendDTO> ngoGrowthTrend = generateMonthlyTrends(
                allUsers.stream().filter(u -> u.getRole() == Role.NGO).collect(Collectors.toList()),
                User::getCreatedAt
        );

        // Activity metrics (using log data)
        long activeUsersThisMonth = getActiveUsersCount(oneMonthAgo);
        long activeUsersThisWeek = getActiveUsersCount(oneWeekAgo);
        long activeUsersToday = getActiveUsersCount(today);

        double userRetentionRate = calculateRetentionRate(allUsers);
        double averageUserLifetime = calculateAverageUserLifetime(allUsers);

        // Approval statistics
        double approvalRate = totalUsers > 0 ? (approvedUsers * 100.0 / totalUsers) : 0;
        double rejectionRate = totalUsers > 0 ? (rejectedUsers * 100.0 / totalUsers) : 0;
        long averageApprovalTime = calculateAverageApprovalTime();

        return AnalyticsUsersDTO.builder()
                .totalUsers(totalUsers)
                .totalLawyers(totalLawyers)
                .totalNgos(totalNgos)
                .totalCitizens(totalCitizens)
                .pendingApprovals(pendingApprovals)
                .approvedUsers(approvedUsers)
                .rejectedUsers(rejectedUsers)
                .reapprovalPendingUsers(reapprovalPendingUsers)
                .usersByLocation(usersByLocation)
                .topLocations(topLocations)
                .userGrowthTrend(userGrowthTrend)
                .lawyerGrowthTrend(lawyerGrowthTrend)
                .ngoGrowthTrend(ngoGrowthTrend)
                .activeUsersThisMonth(activeUsersThisMonth)
                .activeUsersThisWeek(activeUsersThisWeek)
                .activeUsersToday(activeUsersToday)
                .userRetentionRate(userRetentionRate)
                .averageUserLifetime(averageUserLifetime)
                .approvalRate(approvalRate)
                .rejectionRate(rejectionRate)
                .averageApprovalTime(averageApprovalTime)
                .lastUpdated(LocalDateTime.now().toString())
                .build();
    }

    // ==================== CASES ANALYTICS ====================
    public AnalyticsCasesDTO getCasesAnalytics() {
        logger.info("Generating cases analytics");

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);

        List<Case> allCases = caseRepository.findAll();
        long totalCases = allCases.size();

        long openCases = allCases.stream().filter(c -> "OPEN".equals(c.getStatus())).count();
        long assignedCases = allCases.stream().filter(c -> "ASSIGNED".equals(c.getStatus())).count();
        long closedCases = allCases.stream().filter(c -> "CLOSED".equals(c.getStatus())).count();

        // Status distribution
        Map<String, Long> casesByStatus = new HashMap<>();
        casesByStatus.put("OPEN", openCases);
        casesByStatus.put("ASSIGNED", assignedCases);
        casesByStatus.put("CLOSED", closedCases);

        // Priority distribution
        Map<String, Long> casesByPriority = new HashMap<>();
        casesByPriority.put("HIGH", allCases.stream().filter(c -> "HIGH".equals(c.getPriority())).count());
        casesByPriority.put("MEDIUM", allCases.stream().filter(c -> "MEDIUM".equals(c.getPriority())).count());
        casesByPriority.put("LOW", allCases.stream().filter(c -> "LOW".equals(c.getPriority())).count());

        // Case type distribution
        Map<String, Long> casesByType = allCases.stream()
                .filter(c -> c.getCaseType() != null && !c.getCaseType().isEmpty())
                .collect(Collectors.groupingBy(Case::getCaseType, Collectors.counting()));

        // Geographic data
        Map<String, Long> casesByLocation = allCases.stream()
                .filter(c -> c.getLocation() != null && !c.getLocation().isEmpty())
                .collect(Collectors.groupingBy(Case::getLocation, Collectors.counting()));

        List<String> topCaseLocations = casesByLocation.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Expertise tags analysis
        Map<String, Long> casesByExpertiseTag = allCases.stream()
                .flatMap(c -> c.getExpertiseTags() != null ? c.getExpertiseTags().stream() : Stream.empty())
                .filter(tag -> tag != null && !tag.isEmpty())
                .collect(Collectors.groupingBy(String::toString, Collectors.counting()));

        List<String> mostRequestedExpertiseTags = casesByExpertiseTag.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        List<String> leastRequestedExpertiseTags = casesByExpertiseTag.entrySet().stream()
                .sorted((a, b) -> Long.compare(a.getValue(), b.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Trends
        List<AnalyticsTrendDTO> casesCreatedTrend = generateMonthlyTrends(allCases, Case::getCreatedAt);
        List<AnalyticsTrendDTO> casesClosedTrend = generateMonthlyTrends(
                allCases.stream().filter(c -> "CLOSED".equals(c.getStatus())).collect(Collectors.toList()),
                Case::getUpdatedAt
        );

        // Time-based statistics
        long averageCaseAge = calculateAverageCaseAge(allCases);
        long medianCaseAge = calculateMedianCaseAge(allCases);
        long averageResolutionTime = calculateAverageResolutionTime(
                allCases.stream().filter(c -> "CLOSED".equals(c.getStatus())).collect(Collectors.toList())
        );

        double caseResolutionRate = totalCases > 0 ? (closedCases * 100.0 / totalCases) : 0;

        return AnalyticsCasesDTO.builder()
                .totalCases(totalCases)
                .openCases(openCases)
                .assignedCases(assignedCases)
                .closedCases(closedCases)
                .casesByStatus(casesByStatus)
                .casesByPriority(casesByPriority)
                .casesByType(casesByType)
                .casesByLocation(casesByLocation)
                .topCaseLocations(topCaseLocations)
                .casesByExpertiseTag(casesByExpertiseTag)
                .mostRequestedExpertiseTags(mostRequestedExpertiseTags)
                .leastRequestedExpertiseTags(leastRequestedExpertiseTags)
                .casesCreatedTrend(casesCreatedTrend)
                .casesClosedTrend(casesClosedTrend)
                .averageCaseAge(averageCaseAge)
                .medianCaseAge(medianCaseAge)
                .averageResolutionTime(averageResolutionTime)
                .caseResolutionRate(caseResolutionRate)
                .lastUpdated(LocalDateTime.now().toString())
                .build();
    }

    // ==================== MATCHES ANALYTICS ====================
    public AnalyticsMatchesDTO getMatchesAnalytics() {
        logger.info("Generating matches analytics");

        List<Match> allMatches = matchRepository.findAll();
        long totalMatches = allMatches.size();

        long pendingMatches = allMatches.stream().filter(m -> m.getStatus() == MatchStatus.PENDING).count();
        long acceptedMatches = allMatches.stream().filter(m -> m.getStatus() == MatchStatus.ACCEPTED_BY_PROVIDER).count();
        long rejectedMatches = allMatches.stream().filter(m -> m.getStatus() == MatchStatus.REJECTED_BY_CITIZEN || m.getStatus() == MatchStatus.REJECTED_BY_PROVIDER).count();

        // Status distribution
        Map<String, Long> matchesByStatus = new HashMap<>();
        matchesByStatus.put("PENDING", pendingMatches);
        matchesByStatus.put("ACCEPTED_BY_PROVIDER", acceptedMatches);
        matchesByStatus.put("REJECTED", rejectedMatches);

        // Quality metrics
        double averageMatchScore = allMatches.stream()
                .mapToDouble(Match::getMatchScore)
                .average()
                .orElse(0.0);

        long highQualityMatches = allMatches.stream().filter(m -> m.getMatchScore() > 0.7).count();
        long mediumQualityMatches = allMatches.stream().filter(m -> m.getMatchScore() >= 0.4 && m.getMatchScore() <= 0.7).count();
        long lowQualityMatches = allMatches.stream().filter(m -> m.getMatchScore() < 0.4).count();

        double highQualityPercentage = totalMatches > 0 ? (highQualityMatches * 100.0 / totalMatches) : 0;
        double mediumQualityPercentage = totalMatches > 0 ? (mediumQualityMatches * 100.0 / totalMatches) : 0;
        double lowQualityPercentage = totalMatches > 0 ? (lowQualityMatches * 100.0 / totalMatches) : 0;

        // Geographic data
        Map<String, Long> matchesByLocation = allMatches.stream()
                .filter(m -> m.getLegalCase() != null && m.getLegalCase().getLocation() != null)
                .collect(Collectors.groupingBy(m -> m.getLegalCase().getLocation(), Collectors.counting()));

        List<String> topMatchLocations = matchesByLocation.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Trends
        List<AnalyticsTrendDTO> matchesGeneratedTrend = generateMonthlyTrends(allMatches, Match::getCreatedAt);
        List<AnalyticsTrendDTO> matchesAcceptedTrend = generateMonthlyTrends(
                allMatches.stream().filter(m -> m.getStatus() == MatchStatus.ACCEPTED_BY_PROVIDER && m.getAcceptedAt() != null).collect(Collectors.toList()),
                Match::getAcceptedAt
        );
        List<AnalyticsTrendDTO> matchesRejectedTrend = generateMonthlyTrends(
                allMatches.stream().filter(m -> (m.getStatus() == MatchStatus.REJECTED_BY_CITIZEN || m.getStatus() == MatchStatus.REJECTED_BY_PROVIDER) && m.getRejectedAt() != null).collect(Collectors.toList()),
                Match::getRejectedAt
        );

        // Acceptance metrics
        double acceptanceRate = totalMatches > 0 ? (acceptedMatches * 100.0 / totalMatches) : 0;
        double rejectionRate = totalMatches > 0 ? (rejectedMatches * 100.0 / totalMatches) : 0;
        double pendingRate = totalMatches > 0 ? (pendingMatches * 100.0 / totalMatches) : 0;

        long averageTimeToAcceptance = calculateAverageTimeToMatchStatus(allMatches, MatchStatus.ACCEPTED_BY_PROVIDER);
        long averageTimeToRejection = calculateAverageTimeToMatchStatus(allMatches, MatchStatus.REJECTED_BY_CITIZEN);

        // Match ratio per case
        List<Case> casesWithMatches = allMatches.stream()
                .map(Match::getLegalCase)
                .distinct()
                .collect(Collectors.toList());
        double matchRatioPerCase = casesWithMatches.size() > 0 ? (double) totalMatches / casesWithMatches.size() : 0;

        return AnalyticsMatchesDTO.builder()
                .totalMatches(totalMatches)
                .pendingMatches(pendingMatches)
                .acceptedMatches(acceptedMatches)
                .rejectedMatches(rejectedMatches)
                .matchesByStatus(matchesByStatus)
                .averageMatchScore(averageMatchScore)
                .highQualityMatchesPercentage(highQualityPercentage)
                .mediumQualityMatchesPercentage(mediumQualityPercentage)
                .lowQualityMatchesPercentage(lowQualityPercentage)
                .matchesByLocation(matchesByLocation)
                .topMatchLocations(topMatchLocations)
                .matchesGeneratedTrend(matchesGeneratedTrend)
                .matchesAcceptedTrend(matchesAcceptedTrend)
                .matchesRejectedTrend(matchesRejectedTrend)
                .acceptanceRate(acceptanceRate)
                .rejectionRate(rejectionRate)
                .pendingRate(pendingRate)
                .averageTimeToAcceptance(averageTimeToAcceptance)
                .averageTimeToRejection(averageTimeToRejection)
                .matchRatioPerCase(matchRatioPerCase)
                .lastUpdated(LocalDateTime.now().toString())
                .build();
    }

    // ==================== ACTIVITY ANALYTICS ====================
    public AnalyticsActivityDTO getActivityAnalytics() {
        logger.info("Generating activity analytics");

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);

        // Appointment activity
        List<Appointment> allAppointments = appointmentRepository.findAll();
        long totalAppointments = allAppointments.size();
        long appointmentsThisMonth = allAppointments.stream()
                .filter(a -> a.getScheduledDateTime() != null && a.getScheduledDateTime().isAfter(oneMonthAgo))
                .count();
        long appointmentsThisWeek = allAppointments.stream()
                .filter(a -> a.getScheduledDateTime() != null && a.getScheduledDateTime().isAfter(oneWeekAgo))
                .count();
        long appointmentsToday = allAppointments.stream()
                .filter(a -> a.getScheduledDateTime() != null && a.getScheduledDateTime().isAfter(today))
                .count();

        long completedAppointments = allAppointments.stream()
                .filter(a -> a.getStatus() != null && "COMPLETED".equals(a.getStatus().toString()))
                .count();
        long cancelledAppointments = allAppointments.stream()
                .filter(a -> a.getStatus() != null && "CANCELLED".equals(a.getStatus().toString()))
                .count();
        long rescheduleCount = 0; // Placeholder - check if reschedule count exists

        // Chat activity
        List<ChatMessage> allMessages = chatMessageRepository.findAll();
        long totalChatMessages = allMessages.size();
        long messagesThisMonth = allMessages.stream()
                .filter(m -> m.getSentAt() != null && m.getSentAt().isAfter(oneMonthAgo))
                .count();

        // Get unique conversations (using match_id as conversation identifier)
        long activeConversations = allMessages.stream()
                .map(m -> m.getMatch().getId())
                .distinct()
                .count();

        // Trends
        List<AnalyticsTrendDTO> appointmentBookingTrend = generateMonthlyTrends(allAppointments, Appointment::getScheduledDateTime);
        List<AnalyticsTrendDTO> chatActivityTrend = generateMonthlyTrends(allMessages, ChatMessage::getSentAt);

        // Activity by user role
        Map<String, Long> activityByUserRole = new HashMap<>();
        List<User> allUsers = userRepository.findAll();
        activityByUserRole.put("LAWYER", allUsers.stream().filter(u -> u.getRole() == Role.LAWYER).count());
        activityByUserRole.put("NGO", allUsers.stream().filter(u -> u.getRole() == Role.NGO).count());
        activityByUserRole.put("CITIZEN", allUsers.stream().filter(u -> u.getRole() == Role.CITIZEN).count());

        // Geographic activity
        Map<String, Long> activityByLocation = allUsers.stream()
                .filter(u -> u.getLocation() != null && !u.getLocation().isEmpty())
                .collect(Collectors.groupingBy(User::getLocation, Collectors.counting()));

        List<String> mostActiveLocations = activityByLocation.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Response times
        long averageResponseTime = calculateAverageResponseTime(allMessages);
        long averageCaseReviewTime = 24; // Placeholder - would need audit log data
        long averageMatchDecisionTime = 48; // Placeholder - would need match event data

        // Engagement rates
        double lawyerEngagementRate = calculateEngagementRate(Role.LAWYER, oneMonthAgo);
        double ngoEngagementRate = calculateEngagementRate(Role.NGO, oneMonthAgo);
        double citizenEngagementRate = calculateEngagementRate(Role.CITIZEN, oneMonthAgo);

        // Notifications
        List<Notification> allNotifications = notificationRepository.findAll();
        long totalNotificationsSent = allNotifications.size();
        long notificationsThisMonth = allNotifications.stream()
                .filter(n -> n.getCreatedAt() != null && n.getCreatedAt().isAfter(oneMonthAgo))
                .count();

        Map<String, Long> notificationsByType = allNotifications.stream()
                .collect(Collectors.groupingBy(
                        n -> n.getType() != null ? n.getType().toString() : "OTHER",
                        Collectors.counting()
                ));

        return AnalyticsActivityDTO.builder()
                .totalAppointments(totalAppointments)
                .appointmentsThisMonth(appointmentsThisMonth)
                .appointmentsThisWeek(appointmentsThisWeek)
                .appointmentsToday(appointmentsToday)
                .completedAppointments(completedAppointments)
                .cancelledAppointments(cancelledAppointments)
                .rescheduleCount((long) rescheduleCount)
                .totalChatMessages(totalChatMessages)
                .messagesThisMonth(messagesThisMonth)
                .activeConversations(activeConversations)
                .appointmentBookingTrend(appointmentBookingTrend)
                .chatActivityTrend(chatActivityTrend)
                .activityByUserRole(activityByUserRole)
                .activityByLocation(activityByLocation)
                .mostActiveLocations(mostActiveLocations)
                .averageResponseTime(averageResponseTime)
                .averageCaseReviewTime(averageCaseReviewTime)
                .averageMatchDecisionTime(averageMatchDecisionTime)
                .lawyerEngagementRate(lawyerEngagementRate)
                .ngoEngagementRate(ngoEngagementRate)
                .citizenEngagementRate(citizenEngagementRate)
                .totalNotificationsSent(totalNotificationsSent)
                .notificationsThisMonth(notificationsThisMonth)
                .notificationsByType(notificationsByType)
                .lastUpdated(LocalDateTime.now().toString())
                .build();
    }

    // ==================== HELPER METHODS ====================

    private double calculateSystemHealthScore(long users, long cases, long matches) {
        // Simple health score calculation
        double userHealth = Math.min(users / 100.0, 25); // Max 25 points
        double caseHealth = Math.min(cases / 100.0, 25); // Max 25 points
        double matchHealth = Math.min(matches / 100.0, 25); // Max 25 points
        double dataQuality = 25; // Base score for system having data

        return Math.min(userHealth + caseHealth + matchHealth + dataQuality, 100.0);
    }

    private <T> List<AnalyticsTrendDTO> generateMonthlyTrends(List<T> items, java.util.function.Function<T, LocalDateTime> dateExtractor) {
        List<AnalyticsTrendDTO> trends = new ArrayList<>();

        for (int i = 11; i >= 0; i--) {
            LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);

            long count = items.stream()
                    .filter(item -> {
                        LocalDateTime itemDate = dateExtractor.apply(item);
                        return itemDate != null && itemDate.isAfter(monthStart) && itemDate.isBefore(monthEnd);
                    })
                    .count();

            trends.add(AnalyticsTrendDTO.builder()
                    .period("Monthly")
                    .timestamp(monthStart)
                    .count(count)
                    .build());
        }

        return trends;
    }

    private long getActiveUsersCount(LocalDateTime sinceDateTime) {
        List<ApplicationLog> logs = applicationLogRepository.findAll();
        return logs.stream()
                .filter(log -> log.getTimestamp() != null && log.getTimestamp().isAfter(sinceDateTime))
                .map(ApplicationLog::getUsername)
                .filter(username -> username != null && !username.isEmpty())
                .distinct()
                .count();
    }

    private double calculateRetentionRate(List<User> users) {
        if (users.isEmpty()) return 0;

        LocalDateTime twoMonthsAgo = LocalDateTime.now().minusMonths(2);
        long oldUsers = users.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isBefore(twoMonthsAgo))
                .count();

        if (oldUsers == 0) return 0;

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        long activeOldUsers = oldUsers; // Simplified - would need login tracking

        return (activeOldUsers * 100.0 / oldUsers);
    }

    private double calculateAverageUserLifetime(List<User> users) {
        if (users.isEmpty()) return 0;

        return users.stream()
                .filter(u -> u.getCreatedAt() != null)
                .mapToLong(u -> Duration.between(u.getCreatedAt(), LocalDateTime.now()).toDays())
                .average()
                .orElse(0.0);
    }

    private long calculateAverageApprovalTime() {
        List<User> approvedUsers = userRepository.findByApprovalStatusIn(List.of(ApprovalStatus.APPROVED));

        if (approvedUsers.isEmpty()) return 0;

        return (long) approvedUsers.stream()
                .filter(u -> u.getCreatedAt() != null)
                .mapToLong(u -> Duration.between(u.getCreatedAt(), LocalDateTime.now()).toDays())
                .average()
                .orElse(0.0);
    }

    private long calculateAverageCaseAge(List<Case> cases) {
        if (cases.isEmpty()) return 0;

        return (long) cases.stream()
                .filter(c -> c.getCreatedAt() != null)
                .mapToLong(c -> Duration.between(c.getCreatedAt(), LocalDateTime.now()).toDays())
                .average()
                .orElse(0);
    }

    private long calculateMedianCaseAge(List<Case> cases) {
        if (cases.isEmpty()) return 0;

        List<Long> ages = cases.stream()
                .filter(c -> c.getCreatedAt() != null)
                .map(c -> Duration.between(c.getCreatedAt(), LocalDateTime.now()).toDays())
                .sorted()
                .collect(Collectors.toList());

        if (ages.isEmpty()) return 0;

        int middle = ages.size() / 2;
        return ages.size() % 2 == 0 ? (ages.get(middle - 1) + ages.get(middle)) / 2 : ages.get(middle);
    }

    private long calculateAverageResolutionTime(List<Case> cases) {
        if (cases.isEmpty()) return 0;

        return (long) cases.stream()
                .filter(c -> c.getCreatedAt() != null && c.getUpdatedAt() != null)
                .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getUpdatedAt()).toDays())
                .average()
                .orElse(0);
    }

    private long calculateAverageTimeToMatchStatus(List<Match> matches, MatchStatus status) {
        if (status == MatchStatus.ACCEPTED_BY_PROVIDER) {
            List<Match> matchesAccepted = matches.stream()
                    .filter(m -> m.getStatus() == MatchStatus.ACCEPTED_BY_PROVIDER && m.getCreatedAt() != null && m.getAcceptedAt() != null)
                    .collect(Collectors.toList());

            if (matchesAccepted.isEmpty()) return 0;

            return (long) matchesAccepted.stream()
                    .mapToLong(m -> Duration.between(m.getCreatedAt(), m.getAcceptedAt()).toDays())
                    .average()
                    .orElse(0);
        } else if (status == MatchStatus.REJECTED_BY_CITIZEN) {
            List<Match> matchesRejected = matches.stream()
                    .filter(m -> (m.getStatus() == MatchStatus.REJECTED_BY_CITIZEN || m.getStatus() == MatchStatus.REJECTED_BY_PROVIDER) && m.getCreatedAt() != null && m.getRejectedAt() != null)
                    .collect(Collectors.toList());

            if (matchesRejected.isEmpty()) return 0;

            return (long) matchesRejected.stream()
                    .mapToLong(m -> Duration.between(m.getCreatedAt(), m.getRejectedAt()).toDays())
                    .average()
                    .orElse(0);
        }
        return 0;
    }

    private long calculateAverageResponseTime(List<ChatMessage> messages) {
        if (messages.isEmpty()) return 0;

        // Group by match (conversation)
        Map<Long, List<ChatMessage>> messagesByConversation = messages.stream()
                .collect(Collectors.groupingBy(m -> m.getMatch().getId()));

        long totalResponseTime = 0;
        int responseCount = 0;

        for (List<ChatMessage> conversationMessages : messagesByConversation.values()) {
            List<ChatMessage> sortedMessages = conversationMessages.stream()
                    .sorted((a, b) -> {
                        if (a.getSentAt() == null || b.getSentAt() == null) return 0;
                        return a.getSentAt().compareTo(b.getSentAt());
                    })
                    .collect(Collectors.toList());

            for (int i = 1; i < sortedMessages.size(); i++) {
                ChatMessage prev = sortedMessages.get(i - 1);
                ChatMessage curr = sortedMessages.get(i);

                if (prev.getSentAt() != null && curr.getSentAt() != null) {
                    // Only count response if from different sender
                    if (!prev.getSender().getId().equals(curr.getSender().getId())) {
                        long responseTimeMinutes = Duration.between(prev.getSentAt(), curr.getSentAt()).toMinutes();
                        totalResponseTime += responseTimeMinutes;
                        responseCount++;
                    }
                }
            }
        }

        return responseCount > 0 ? totalResponseTime / responseCount : 0;
    }

    private double calculateEngagementRate(Role role, LocalDateTime sinceDateTime) {
        List<User> usersWithRole = userRepository.findAll().stream()
                .filter(u -> u.getRole() == role)
                .collect(Collectors.toList());

        if (usersWithRole.isEmpty()) return 0;

        List<ApplicationLog> recentLogs = applicationLogRepository.findAll().stream()
                .filter(log -> log.getTimestamp() != null && log.getTimestamp().isAfter(sinceDateTime))
                .collect(Collectors.toList());

        long activeUsernames = recentLogs.stream()
                .map(ApplicationLog::getUsername)
                .filter(username -> username != null && !username.isEmpty())
                .distinct()
                .filter(username -> usersWithRole.stream().anyMatch(u -> u.getUsername().equals(username)))
                .count();

        return (activeUsernames * 100.0 / usersWithRole.size());
    }
}
