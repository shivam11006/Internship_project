package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.ApprovalRequest;
import com.example.legalaid_backend.DTO.ApprovalResponse;
import com.example.legalaid_backend.DTO.PendingApproval;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.service.AdminService;
import com.example.legalaid_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final AdminService adminService;
    private final UserService userService;

    /**
     * GET ALL PENDING APPROVALS
     * GET /api/admin/pending-approvals
     */
    @GetMapping("/pending-approvals")
    public ResponseEntity<List<PendingApproval>> getPendingApprovals() {
        logger.info("Admin requested: Fetching all pending approvals");
        List<PendingApproval> pending = adminService.getPendingApprovals();
        logger.info("Pending approvals fetched: {}", pending.size());
        return ResponseEntity.ok(pending);
    }

    /**
     * APPROVE OR REJECT USER
     * POST /api/admin/approve/{id}
     */
    @PostMapping("/approve/{id}")
    public ResponseEntity<ApprovalResponse> approveUser(@PathVariable Long id) {
        logger.info("Admin action: Attempting to approve user with ID {}", id);
        try {
            ApprovalResponse response = adminService.approveUser(id);
            logger.info("User approved successfully: ID {}", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error approving user {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * REJECT USER
     * POST /api/admin/reject/{id}
     */
    @PostMapping("/reject/{id}")
    public ResponseEntity<ApprovalResponse> rejectUser(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {

        logger.info("Admin action: Attempting to reject user with ID {}", id);

        try {
            ApprovalResponse response = adminService.rejectUser(id);
            logger.info("User rejected successfully: ID {}", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error rejecting user {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * SUSPEND USER
     * POST /api/admin/suspend/{id}
     */
    @PostMapping("/suspend/{id}")
    public ResponseEntity<?> suspendUser(@PathVariable Long id) {

        logger.info("Admin action: Attempting to suspend user with ID {}", id);

        try {
            ApprovalResponse response = adminService.suspendUser(id);
            logger.info("User suspended successfully: ID {}", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error suspending user {}: {}", id, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * REACTIVATE USER
     * POST /api/admin/reactivate/{id}
     */
    @PostMapping("/reactivate/{id}")
    public ResponseEntity<?> reactivateUser(@PathVariable Long id) {

        logger.info("Admin action: Attempting to reactivate user with ID {}", id);

        try {
            ApprovalResponse response = adminService.reactivateUser(id);
            logger.info("User reactivated successfully: ID {}", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error reactivating user {}: {}", id, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET ALL USERS
     * GET /api/admin/users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        logger.info("Admin requested: Fetching all users");
        List<UserResponse> users = userService.getAllUsers();
        logger.info("Admin fetched {} users", users.size());

        return ResponseEntity.ok(users);
    }

    /**
     * GET USER BY ID
     * GET /api/admin/users/{id}
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {

        logger.info("Admin requested: Fetching user with ID {}", id);

        try {
            UserResponse user = userService.getUserById(id);
            logger.info("User fetched successfully: ID {}", id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error fetching user {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE USER
     * DELETE /api/admin/users/{id}
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {

        logger.info("Admin action: Attempting to delete user with ID {}", id);

        try {
            userService.deleteUser(id);
            logger.info("User deleted successfully: ID {}", id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error deleting user {}: {}", id, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET STATISTICS
     * GET /api/admin/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStatistics() {
        logger.info("Admin requested: Fetching dashboard statistics");
        Object stats = adminService.getStatistics();
        logger.info("Statistics fetched successfully");
        return ResponseEntity.ok(stats);
    }
}
