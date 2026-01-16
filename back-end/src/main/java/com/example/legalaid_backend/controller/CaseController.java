package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.CaseResponse;
import com.example.legalaid_backend.DTO.CreateCaseRequest;
import com.example.legalaid_backend.service.CaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequestMapping("/api/cases")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CaseController {

    private final CaseService caseService;

    /**
     * CREATE CASE
     * POST /api/cases
     */
    @PostMapping
    public ResponseEntity<CaseResponse> createCase(
            @RequestBody CreateCaseRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/cases");

        try {
            log.info("Case creation request received from user: {}, type: {}, attachments: {}",
                    auth.getName(),
                    request.getCaseType(),
                    request.getAttachments() != null ? request.getAttachments().size() : 0);

            CaseResponse response = caseService.createCase(request);

            log.info("Case created successfully: ID {}, type: {}, status: {}",
                    response.getId(),
                    response.getCaseType(),
                    response.getStatus());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to create case for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET MY CASES
     * GET /api/cases/my
     */
    @GetMapping("/my")
    public ResponseEntity<List<CaseResponse>> getMyCases(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/cases/my");

        try {
            log.info("User {} requested their cases", auth.getName());

            List<CaseResponse> cases = caseService.getMyCases();

            log.info("Retrieved {} cases for user {}", cases.size(), auth.getName());

            return ResponseEntity.ok(cases);

        } catch (Exception e) {
            log.error("Failed to retrieve cases for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET CASE BY ID
     * GET /api/cases/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CaseResponse> getCaseById(
            @PathVariable Long id,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/cases/" + id);

        try {
            log.info("User {} requested case ID {}", auth.getName(), id);

            CaseResponse response = caseService.getCaseById(id);

            log.info("Case retrieved successfully: ID {}, type: {}", id, response.getCaseType());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to retrieve case ID {} for user {}: {}",
                    id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * UPDATE CASE
     * PUT /api/cases/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<CaseResponse> updateCase(
            @PathVariable Long id,
            @RequestBody CreateCaseRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/cases/" + id);

        try {
            log.info("Case update request received from user: {} for case ID: {}", auth.getName(), id);

            CaseResponse response = caseService.updateCase(id, request);

            log.info("Case updated successfully: ID {}, type: {}, status: {}",
                    response.getId(),
                    response.getCaseType(),
                    response.getStatus());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to update case ID {} for user {}: {}", id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * UPDATE CASE STATUS
     * PATCH /api/cases/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateCaseStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/cases/" + id + "/status");

        try {
            String newStatus = request.get("status");
            log.info("Case status update request received from user: {} for case ID: {}, new status: {}",
                    auth.getName(), id, newStatus);

            CaseResponse response = caseService.updateCaseStatus(id, newStatus);

            log.info("Case status updated successfully: ID {}, new status: {}", id, response.getStatus());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Failed to update case status for ID {} by user {}: {}",
                    id, auth.getName(), e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Failed to update case status for ID {} by user {}: {}",
                    id, auth.getName(), e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred");
            return ResponseEntity.status(500).body(error);
        } finally {
            MDC.clear();
        }
    }
}
