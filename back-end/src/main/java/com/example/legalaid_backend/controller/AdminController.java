package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.ApprovalRequest;
import com.example.legalaid_backend.DTO.ApprovalResponse;
import com.example.legalaid_backend.DTO.PendingApproval;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.service.AdminService;
import com.example.legalaid_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
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
}
