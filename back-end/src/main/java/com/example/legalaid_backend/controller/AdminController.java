package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.service.AdminService;
import com.example.legalaid_backend.service.LogService;
import com.example.legalaid_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final LogService logService;

    /**
     * GET ALL PENDING APPROVALS
     * GET /api/admin/pending-approvals
     */
    @GetMapping("/pending-approvals")
    public ResponseEntity<List<PendingApproval>> getPendingApprovals(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/pending-approvals");

        try {
            log.info("Admin requested: Fetching all pending approvals");
            List<PendingApproval> pending = adminService.getPendingApprovals();
            log.info("Pending approvals fetched successfully: {} records", pending.size());
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            log.error("Failed to fetch pending approvals", e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * APPROVE OR REJECT USER
     * POST /api/admin/approve/{id}
     */
    @PostMapping("/approve/{id}")
    public ResponseEntity<ApprovalResponse> approveUser(
            @PathVariable Long id,
            Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/approve/" + id);

        try {
            log.info("Admin action: Attempting to approve user with ID {}", id);
            ApprovalResponse response = adminService.approveUser(id);
            log.info("User approved successfully: ID {}, Email: {}", id, response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to approve user ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(null);
        } finally {
            MDC.clear();
        }
    }

    /**
     * REJECT USER
     * POST /api/admin/reject/{id}
     */
    @PostMapping("/reject/{id}")
    public ResponseEntity<ApprovalResponse> rejectUser(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/reject/" + id);

        try {
            log.info("Admin action: Attempting to reject user with ID {}", id);
            ApprovalResponse response = adminService.rejectUser(id);
            log.info("User rejected successfully: ID {}, Email: {}", id, response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to reject user ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(null);
        } finally {
            MDC.clear();
        }
    }

    /**
     * SUSPEND USER
     * POST /api/admin/suspend/{id}
     */
    @PostMapping("/suspend/{id}")
    public ResponseEntity<?> suspendUser(@PathVariable Long id, Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/suspend/" + id);

        try {
            log.info("Admin action: Attempting to suspend user with ID {}", id);
            ApprovalResponse response = adminService.suspendUser(id);
            log.info("User suspended successfully: ID {}, Email: {}", id, response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to suspend user ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * REACTIVATE USER
     * POST /api/admin/reactivate/{id}
     */
    @PostMapping("/reactivate/{id}")
    public ResponseEntity<?> reactivateUser(@PathVariable Long id, Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/reactivate/" + id);

        try {
            log.info("Admin action: Attempting to reactivate user with ID {}", id);
            ApprovalResponse response = adminService.reactivateUser(id);
            log.info("User reactivated successfully: ID {}, Email: {}", id, response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to reactivate user ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET ALL USERS
     * GET /api/admin/users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/users");

        try {
            log.info("Admin requested: Fetching all users");
            List<UserResponse> users = userService.getAllUsers();
            log.info("Admin fetched {} users successfully", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Failed to fetch all users", e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET USER BY ID
     * GET /api/admin/users/{id}
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/users/" + id);

        try {
            log.info("Admin requested: Fetching user with ID {}", id);
            UserResponse user = userService.getUserById(id);
            log.info("User fetched successfully: ID {}, Email: {}", id, user.getEmail());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("Failed to fetch user ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        } finally {
            MDC.clear();
        }
    }

    /**
     * DELETE USER
     * DELETE /api/admin/users/{id}
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/users/" + id);

        try {
            log.warn("Admin action: Attempting to DELETE user with ID {}", id);
            userService.deleteUser(id);
            log.warn("User DELETED successfully: ID {}", id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to delete user ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET STATISTICS
     * GET /api/admin/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStatistics(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/stats");

        try {
            log.info("Admin requested: Fetching dashboard statistics");
            Object stats = adminService.getStatistics();
            log.debug("Statistics fetched successfully: {}", stats);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to fetch statistics", e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    // =============================================
    // USER STATUS MANAGEMENT
    // =============================================

    /**
     * UPDATE USER STATUS
     * PUT /api/admin/users/{id}/status
     * Updates user enabled status and/or approval status
     */
    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long id,
            @RequestBody UserStatusUpdateRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/users/" + id + "/status");

        try {
            log.info("Admin action: Updating status for user ID {}", id);
            ApprovalResponse response = adminService.updateUserStatus(id, request);
            log.info("User status updated successfully: ID {}, Email: {}", id, response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to update user status ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    // =============================================
    // VERIFICATION MANAGEMENT
    // =============================================

    /**
     * GET ALL PENDING VERIFICATIONS
     * GET /api/admin/verifications
     * Returns pending verifications for lawyers and NGOs
     */
    @GetMapping("/verifications")
    public ResponseEntity<List<VerificationResponse>> getPendingVerifications(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/verifications");

        try {
            log.info("Admin requested: Fetching pending verifications");
            List<VerificationResponse> verifications = adminService.getPendingVerifications();
            log.info("Pending verifications fetched: {} records", verifications.size());
            return ResponseEntity.ok(verifications);
        } catch (Exception e) {
            log.error("Failed to fetch pending verifications", e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * VERIFY LAWYER
     * PUT /api/admin/verify/lawyer/{id}
     * Approves a lawyer's verification request
     */
    @PutMapping("/verify/lawyer/{id}")
    public ResponseEntity<?> verifyLawyer(@PathVariable Long id, Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/verify/lawyer/" + id);

        try {
            log.info("Admin action: Verifying lawyer with ID {}", id);
            ApprovalResponse response = adminService.verifyLawyer(id);
            log.info("Lawyer verified successfully: ID {}, Email: {}", id, response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to verify lawyer ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * VERIFY NGO
     * PUT /api/admin/verify/ngo/{id}
     * Approves an NGO's verification request
     */
    @PutMapping("/verify/ngo/{id}")
    public ResponseEntity<?> verifyNgo(@PathVariable Long id, Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/verify/ngo/" + id);

        try {
            log.info("Admin action: Verifying NGO with ID {}", id);
            ApprovalResponse response = adminService.verifyNgo(id);
            log.info("NGO verified successfully: ID {}, Email: {}", id, response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to verify NGO ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    // =============================================
    // CASE MANAGEMENT (ADMIN VIEW)
    // =============================================

    /**
     * GET ALL CASES
     * GET /api/admin/cases
     * Returns all cases with pagination and sorting (admin view)
     */
    @GetMapping("/cases")
    public ResponseEntity<?> getAllCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            @RequestParam(defaultValue = "false") boolean noPagination,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/cases");

        try {
            log.info("Admin requested: Fetching all cases");
            
            if (noPagination) {
                List<AdminCaseResponse> cases = adminService.getAllCasesList();
                log.info("Admin fetched {} cases (no pagination)", cases.size());
                return ResponseEntity.ok(cases);
            } else {
                Page<AdminCaseResponse> cases = adminService.getAllCases(page, size, sortBy, sortOrder);
                log.info("Admin fetched {} cases (page {} of {})", 
                        cases.getNumberOfElements(), page, cases.getTotalPages());
                return ResponseEntity.ok(cases);
            }
        } catch (Exception e) {
            log.error("Failed to fetch cases", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    // =============================================
    // SYSTEM MONITORING
    // =============================================

    /**
     * GET SYSTEM LOGS
     * GET /api/admin/system/logs
     * Returns system logs with optional filtering
     */
    @GetMapping("/system/logs")
    public ResponseEntity<?> getSystemLogs(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String endpoint,
            @RequestParam(required = false) String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/system/logs");

        try {
            log.info("Admin requested: Fetching system logs");
            
            LogSearchRequest request = new LogSearchRequest();
            request.setLevel(level);
            request.setEndpoint(endpoint);
            request.setUsername(username);
            request.setPage(page);
            request.setSize(size);
            request.setSortBy(sortBy);
            request.setSortOrder(sortOrder);
            
            // Parse dates if provided
            if (startDate != null && !startDate.isEmpty()) {
                request.setStartDate(java.time.LocalDateTime.parse(startDate));
            }
            if (endDate != null && !endDate.isEmpty()) {
                request.setEndDate(java.time.LocalDateTime.parse(endDate));
            }
            
            Page<LogResponse> logs = logService.searchLogs(request);
            log.info("System logs fetched: {} records", logs.getTotalElements());
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            log.error("Failed to fetch system logs", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET SYSTEM HEALTH
     * GET /api/admin/health
     * Returns system health status including database, memory, and CPU metrics
     */
    @GetMapping("/health")
    public ResponseEntity<SystemHealthResponse> getSystemHealth(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/health");

        try {
            log.info("Admin requested: System health check");
            SystemHealthResponse health = adminService.getSystemHealth();
            log.info("System health: {}", health.getStatus());
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            log.error("Failed to get system health", e);
            throw e;
        } finally {
            MDC.clear();
        }
    }
}
