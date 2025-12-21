package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.DirectorySearchRequest;
import com.example.legalaid_backend.DTO.LawyerDirectoryResponse;
import com.example.legalaid_backend.DTO.NgoDirectoryResponse;
import com.example.legalaid_backend.service.DirectoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/directory")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DirectoryController {
    private final DirectoryService directoryService;

    /**
     * POST /api/directory/lawyers/search
     * Search lawyers with filters, sorting, and pagination
     */
    @PostMapping("/lawyers/search")
    public ResponseEntity<Page<LawyerDirectoryResponse>> searchLawyers(
            @RequestBody DirectorySearchRequest request) {
        return ResponseEntity.ok(directoryService.searchLawyers(request));
    }

    /**
     * GET /api/directory/lawyers/{userId}
     * Get specific lawyer details
     */
    @GetMapping("/lawyers/{userId}")
    public ResponseEntity<LawyerDirectoryResponse> getLawyerById(@PathVariable Long userId) {
        return ResponseEntity.ok(directoryService.getLawyerById(userId));
    }

    /**
     * POST /api/directory/ngos/search
     * Search NGOs with filters, sorting, and pagination
     */
    @PostMapping("/ngos/search")
    public ResponseEntity<Page<NgoDirectoryResponse>> searchNgos(
            @RequestBody DirectorySearchRequest request) {
        return ResponseEntity.ok(directoryService.searchNgos(request));
    }

    /**
     * GET /api/directory/ngos/{userId}
     * Get specific NGO details
     */
    @GetMapping("/ngos/{userId}")
    public ResponseEntity<NgoDirectoryResponse> getNgoById(@PathVariable Long userId) {
        return ResponseEntity.ok(directoryService.getNgoById(userId));
    }
}
