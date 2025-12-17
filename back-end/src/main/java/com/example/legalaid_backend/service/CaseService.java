package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.CaseResponse;
import com.example.legalaid_backend.DTO.CreateCaseRequest;
import com.example.legalaid_backend.entity.Case;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.CaseRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.CasePriority;
import com.example.legalaid_backend.util.CaseStatus;
import com.example.legalaid_backend.util.CaseType;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaseService {

    private static final Logger logger = LoggerFactory.getLogger(CaseService.class);

    private final CaseRepository caseRepository;
    private final UserRepository userRepository;

    // =========================
    // CREATE CASE (CITIZEN)
    // =========================
    @Transactional
    public CaseResponse createCase(CreateCaseRequest request) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.CITIZEN) {
            logger.error("Only CITIZEN can create cases. User: {}", currentUser.getEmail());
            throw new RuntimeException("Only citizens can create cases");
        }

        logger.info("Creating new case for citizen {}", currentUser.getEmail());

        Case legalCase = new Case();
        legalCase.setTitle(request.getTitle());
        legalCase.setDescription(request.getDescription());
        legalCase.setCaseType(request.getCaseType());
        legalCase.setPriority(request.getPriority()); // ✅ FIX
        legalCase.setStatus("OPEN");
        legalCase.setCreatedBy(currentUser);

        Case savedCase = caseRepository.save(legalCase);

        logger.info("Case created successfully with ID {}", savedCase.getId());

        return toResponse(savedCase);
    }

    // =========================
    // GET MY CASES (CITIZEN)
    // =========================
    public List<CaseResponse> getMyCases() {

        User currentUser = getCurrentUser();

        logger.info("Fetching cases created by {}", currentUser.getEmail());

        return caseRepository.findByCreatedBy(currentUser)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // GET OPEN CASES (ADMIN)
    // =========================
    public List<CaseResponse> getOpenCases() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN) {
            logger.error("Only ADMIN can view open cases");
            throw new RuntimeException("Access denied");
        }

        logger.info("Admin fetching OPEN cases");

        return caseRepository.findByStatus("OPEN")
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // ASSIGN CASE (ADMIN)
    // =========================
    @Transactional
    public CaseResponse assignCase(Long caseId, Long assigneeId) {

        User admin = getCurrentUser();

        if (admin.getRole() != Role.ADMIN) {
            logger.error("Only ADMIN can assign cases");
            throw new RuntimeException("Access denied");
        }

        Case legalCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (assignee.getRole() != Role.LAWYER && assignee.getRole() != Role.NGO) {
            throw new RuntimeException("Case can be assigned only to Lawyer or NGO");
        }

        legalCase.setAssignedTo(assignee);
        legalCase.setStatus("ASSIGNED");

        logger.info("Case {} assigned to {}", caseId, assignee.getEmail());

        return toResponse(caseRepository.save(legalCase));
    }

    // =========================
    // GET ASSIGNED CASES (LAWYER / NGO)
    // =========================
    public List<CaseResponse> getAssignedCases() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.LAWYER && currentUser.getRole() != Role.NGO) {
            throw new RuntimeException("Access denied");
        }

        logger.info("Fetching assigned cases for {}", currentUser.getEmail());

        return caseRepository.findByAssignedTo(currentUser)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
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

        // ✅ String → Enum conversion
        response.setCaseType(
                CaseType.valueOf(legalCase.getCaseType())
        );

        response.setPriority(
                CasePriority.valueOf(legalCase.getPriority())
        );

        response.setStatus(
                CaseStatus.valueOf(legalCase.getStatus())
        );

        response.setCreatedBy(legalCase.getCreatedBy().getId());

        response.setAssignedTo(
                legalCase.getAssignedTo() != null
                        ? legalCase.getAssignedTo().getId()
                        : null
        );

        response.setCreatedAt(legalCase.getCreatedAt());
        response.setUpdatedAt(legalCase.getUpdatedAt());

        return response;
    }
}
