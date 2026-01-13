package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/analytics/overview
     * Returns overall platform analytics including user count, case count, match count, etc.
     * Admin access only
     */
    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewDTO> getOverviewAnalytics(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/analytics/overview");

        try {
            log.info("Admin {} requested: Fetching overview analytics", auth.getName());
            AnalyticsOverviewDTO overview = analyticsService.getOverviewAnalytics();
            log.info("Overview analytics fetched successfully");
            return ResponseEntity.ok(overview);
        } catch (Exception e) {
            log.error("Failed to fetch overview analytics", e);
            throw e;
        }
    }

    /**
     * GET /api/analytics/users
     * Returns detailed user analytics including counts, trends, geographic breakdown, etc.
     * Admin access only
     */
    @GetMapping("/users")
    public ResponseEntity<AnalyticsUsersDTO> getUsersAnalytics(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/analytics/users");

        try {
            log.info("Admin {} requested: Fetching users analytics", auth.getName());
            AnalyticsUsersDTO usersAnalytics = analyticsService.getUsersAnalytics();
            log.info("Users analytics fetched successfully");
            return ResponseEntity.ok(usersAnalytics);
        } catch (Exception e) {
            log.error("Failed to fetch users analytics", e);
            throw e;
        }
    }

    /**
     * GET /api/analytics/cases
     * Returns detailed case analytics including counts, trends, geographic breakdown, expertise tags, etc.
     * Admin access only
     */
    @GetMapping("/cases")
    public ResponseEntity<AnalyticsCasesDTO> getCasesAnalytics(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/analytics/cases");

        try {
            log.info("Admin {} requested: Fetching cases analytics", auth.getName());
            AnalyticsCasesDTO casesAnalytics = analyticsService.getCasesAnalytics();
            log.info("Cases analytics fetched successfully");
            return ResponseEntity.ok(casesAnalytics);
        } catch (Exception e) {
            log.error("Failed to fetch cases analytics", e);
            throw e;
        }
    }

    /**
     * GET /api/analytics/matches
     * Returns detailed match analytics including counts, trends, quality metrics, geographic breakdown, etc.
     * Admin access only
     */
    @GetMapping("/matches")
    public ResponseEntity<AnalyticsMatchesDTO> getMatchesAnalytics(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/analytics/matches");

        try {
            log.info("Admin {} requested: Fetching matches analytics", auth.getName());
            AnalyticsMatchesDTO matchesAnalytics = analyticsService.getMatchesAnalytics();
            log.info("Matches analytics fetched successfully");
            return ResponseEntity.ok(matchesAnalytics);
        } catch (Exception e) {
            log.error("Failed to fetch matches analytics", e);
            throw e;
        }
    }

    /**
     * GET /api/analytics/activity
     * Returns platform activity analytics including appointments, chat activity, engagement rates, etc.
     * Admin access only
     */
    @GetMapping("/activity")
    public ResponseEntity<AnalyticsActivityDTO> getActivityAnalytics(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/analytics/activity");

        try {
            log.info("Admin {} requested: Fetching activity analytics", auth.getName());
            AnalyticsActivityDTO activityAnalytics = analyticsService.getActivityAnalytics();
            log.info("Activity analytics fetched successfully");
            return ResponseEntity.ok(activityAnalytics);
        } catch (Exception e) {
            log.error("Failed to fetch activity analytics", e);
            throw e;
        }
    }
}
