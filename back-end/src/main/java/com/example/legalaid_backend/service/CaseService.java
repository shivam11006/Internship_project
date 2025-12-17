package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.CaseResponse;
import com.example.legalaid_backend.DTO.CreateCaseRequest;
import com.example.legalaid_backend.entity.Case;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.CaseRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaseService {

    private final CaseRepository caseRepository;
    private final UserRepository userRepository;

    // =========================
    // CREATE CASE (CITIZEN)
    // =========================
    @Transactional
    public CaseResponse createCase(CreateCaseRequest request) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.CITIZEN) {
            throw new RuntimeException("Only citizens can create cases");
        }

        Case legalCase = new Case();
        legalCase.setTitle(request.getTitle());
        legalCase.setDescription(request.getDescription());
        legalCase.setCaseType(request.getCaseType());
        legalCase.setPriority(request.getPriority());
        legalCase.setStatus("SUBMITTED"); // ✅ default status
        legalCase.setCreatedBy(currentUser);

        return toResponse(caseRepository.save(legalCase));
    }

    // =========================
    // GET MY CASES (CITIZEN)
    // =========================
    public List<CaseResponse> getMyCases() {

        User currentUser = getCurrentUser();

        return caseRepository.findByCreatedBy(currentUser)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // GET CASE BY ID (CITIZEN)
    // =========================
    public CaseResponse getCaseById(Long id) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.CITIZEN) {
            throw new RuntimeException("Access denied");
        }

        Case legalCase = caseRepository
                .findByIdAndCreatedBy(id, currentUser)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        return toResponse(legalCase);
    }

    // =========================
    // HELPERS
    // =========================
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private CaseResponse toResponse(Case legalCase) {

        CaseResponse response = new CaseResponse();
        response.setId(legalCase.getId());
        response.setTitle(legalCase.getTitle());
        response.setDescription(legalCase.getDescription());
        response.setCaseType(legalCase.getCaseType());
        response.setPriority(legalCase.getPriority());
        response.setStatus(legalCase.getStatus());
        response.setCreatedBy(legalCase.getCreatedBy().getId());
        response.setCreatedAt(legalCase.getCreatedAt());
        response.setUpdatedAt(legalCase.getUpdatedAt());

        return response;
    }
}
