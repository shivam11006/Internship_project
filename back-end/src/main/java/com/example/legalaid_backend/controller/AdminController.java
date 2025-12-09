package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.ApprovalRequest;
import com.example.legalaid_backend.DTO.ApprovalResponse;
import com.example.legalaid_backend.DTO.PendingApproval;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.service.AdminService;
import com.example.legalaid_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    private final AdminService adminService;
    private final UserService userService;

    /**
     * GET ALL PENDING APPROVALS
     * GET /api/admin/pending-approvals
     */
    @GetMapping("/pending-approvals")
    public ResponseEntity<List<PendingApproval>> getPendingApprovals() {
        List<PendingApproval> pending = adminService.getPendingApprovals();
        return ResponseEntity.ok(pending);
    }

    /**
     * APPROVE OR REJECT USER
     * POST /api/admin/approve
     */
    @PostMapping("/approve")
    public ResponseEntity<?> approveOrRejectUser(@Valid @RequestBody ApprovalRequest request) {
        try {
            ApprovalResponse response = adminService.approveOrRejectUser(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * SUSPEND USER
     * POST /api/admin/suspend/{userId}
     * Suspends a user account (cannot login)
     */
    @PostMapping("/suspend/{userId}")
    public ResponseEntity<?> suspendUser(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason) {
        try {
            ApprovalResponse response = adminService.suspendUser(userId, reason);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * REACTIVATE USER
     * POST /api/admin/reactivate/{userId}
     * Reactivates a suspended account
     */
    @PostMapping("/reactivate/{userId}")
    public ResponseEntity<?> reactivateUser(@PathVariable Long userId) {
        try {
            ApprovalResponse response = adminService.reactivateUser(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET ALL USERS
     * GET /api/admin/users
     * Returns all users in the system
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * GET USER BY ID
     * GET /api/admin/users/{id}
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE USER
     * DELETE /api/admin/users/{id}
     * Permanently deletes a user
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET STATISTICS
     * GET /api/admin/stats
     * Returns dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStatistics() {
        Object stats = adminService.getStatistics();
        return ResponseEntity.ok(stats);
    }
}
