package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.CaseResponse;
import com.example.legalaid_backend.DTO.CreateCaseRequest;
import com.example.legalaid_backend.service.CaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseController {

    private static final Logger logger = LoggerFactory.getLogger(CaseController.class);

    private final CaseService caseService;

    // =========================
    // CREATE CASE (CITIZEN)
    // =========================
    @PostMapping
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<CaseResponse> createCase(
            @Valid @RequestBody CreateCaseRequest request) {

        logger.info("Received request to create case");
        return ResponseEntity.ok(caseService.createCase(request));
    }

    // =========================
    // GET MY CASES (CITIZEN)
    // =========================
    @GetMapping("/my")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<List<CaseResponse>> getMyCases() {

        logger.info("Fetching cases for current citizen");
        return ResponseEntity.ok(caseService.getMyCases());
    }

    // =========================
    // GET OPEN CASES (ADMIN)
    // =========================
    @GetMapping("/open")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CaseResponse>> getOpenCases() {

        logger.info("Admin fetching open cases");
        return ResponseEntity.ok(caseService.getOpenCases());
    }

    // =========================
    // ASSIGN CASE (ADMIN)
    // =========================
    @PutMapping("/{caseId}/assign/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CaseResponse> assignCase(
            @PathVariable Long caseId,
            @PathVariable Long userId) {

        logger.info("Assigning case {} to user {}", caseId, userId);
        return ResponseEntity.ok(caseService.assignCase(caseId, userId));
    }

    // =========================
    // GET ASSIGNED CASES (LAWYER / NGO)
    // =========================
    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('LAWYER','NGO')")
    public ResponseEntity<List<CaseResponse>> getAssignedCases() {

        logger.info("Fetching assigned cases for professional");
        return ResponseEntity.ok(caseService.getAssignedCases());
    }
}
