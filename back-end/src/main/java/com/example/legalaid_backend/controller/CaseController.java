package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.CaseResponse;
import com.example.legalaid_backend.DTO.CreateCaseRequest;
import com.example.legalaid_backend.service.CaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService caseService;

    // POST /cases
    @PostMapping
    public ResponseEntity<CaseResponse> createCase(
            @RequestBody CreateCaseRequest request) {
        return ResponseEntity.ok(caseService.createCase(request));
    }

    // GET /cases/my
    @GetMapping("/my")
    public ResponseEntity<List<CaseResponse>> getMyCases() {
        return ResponseEntity.ok(caseService.getMyCases());
    }

    // GET /cases/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CaseResponse> getCaseById(@PathVariable Long id) {
        return ResponseEntity.ok(caseService.getCaseById(id));
    }
}
