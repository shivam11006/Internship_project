package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.DirectorySearchRequest;
import com.example.legalaid_backend.DTO.LawyerDirectoryResponse;
import com.example.legalaid_backend.DTO.NgoDirectoryResponse;
import com.example.legalaid_backend.service.DirectoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/directory")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DirectoryController {
    private final DirectoryService directoryService;

    /**
     * SEARCH LAWYERS
     * POST /api/directory/lawyers/search
     */
    @PostMapping("/lawyers/search")
    public ResponseEntity<Page<LawyerDirectoryResponse>> searchLawyers(
            @RequestBody DirectorySearchRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/directory/lawyers/search");

        try {
            log.debug("Lawyer search request from user {}: specialization={}, keyword={}, location={}, page={}",
                    auth.getName(),
                    request.getExpertise(),
                    request.getKeyword(),
                    request.getLocation(),
                    request.getPage());

            Page<LawyerDirectoryResponse> results = directoryService.searchLawyers(request);

            log.info("Lawyer search completed: {} total results (page {} of {})",
                    results.getTotalElements(),
                    results.getNumber() + 1,
                    results.getTotalPages());

            return ResponseEntity.ok(results);

        } catch (Exception e) {
            log.error("Failed to search lawyers for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET LAWYER BY ID
     * GET /api/directory/lawyers/{userId}
     */
    @GetMapping("/lawyers/{userId}")
    public ResponseEntity<LawyerDirectoryResponse> getLawyerById(
            @PathVariable Long userId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/directory/lawyers/" + userId);

        try {
            log.debug("User {} requested lawyer profile: ID {}", auth.getName(), userId);

            LawyerDirectoryResponse lawyer = directoryService.getLawyerById(userId);

            log.info("Lawyer profile retrieved: ID {}", userId);

            return ResponseEntity.ok(lawyer);

        } catch (Exception e) {
            log.error("Failed to retrieve lawyer ID {} for user {}: {}",
                    userId, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * SEARCH NGOs
     * POST /api/directory/ngos/search
     */
    @PostMapping("/ngos/search")
    public ResponseEntity<Page<NgoDirectoryResponse>> searchNgos(
            @RequestBody DirectorySearchRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/directory/ngos/search");

        try {
            log.debug("NGO search request from user {}: focusArea={}, keyword={}, page={}",
                    auth.getName(),
                    request.getExpertise(),
                    request.getKeyword(),
                    request.getPage());

            Page<NgoDirectoryResponse> results = directoryService.searchNgos(request);

            log.info("NGO search completed: {} total results (page {} of {})",
                    results.getTotalElements(),
                    results.getNumber() + 1,
                    results.getTotalPages());

            return ResponseEntity.ok(results);

        } catch (Exception e) {
            log.error("Failed to search NGOs for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET NGO BY ID
     * GET /api/directory/ngos/{userId}
     */
    @GetMapping("/ngos/{userId}")
    public ResponseEntity<NgoDirectoryResponse> getNgoById(
            @PathVariable Long userId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/directory/ngos/" + userId);

        try {
            log.debug("User {} requested NGO profile: ID {}", auth.getName(), userId);

            NgoDirectoryResponse ngo = directoryService.getNgoById(userId);

            log.info("NGO profile retrieved: ID {}", userId);

            return ResponseEntity.ok(ngo);

        } catch (Exception e) {
            log.error("Failed to retrieve NGO ID {} for user {}: {}",
                    userId, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }
}
