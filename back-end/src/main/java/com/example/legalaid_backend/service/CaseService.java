package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.AttachmentDTO;
import com.example.legalaid_backend.DTO.CaseResponse;
import com.example.legalaid_backend.DTO.CreateCaseRequest;
import com.example.legalaid_backend.entity.Case;
import com.example.legalaid_backend.entity.CaseAttachment;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.CaseRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
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
        legalCase.setLocation(request.getLocation());
        legalCase.setPreferredLanguage(request.getPreferredLanguage());
        legalCase.setExpertiseTags(request.getExpertiseTags());
        legalCase.setStatus("SUBMITTED"); // ✅ default status
        legalCase.setCreatedBy(currentUser);

        // Handle Attachments
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            log.info("Processing {} attachments for new case", request.getAttachments().size());
            java.util.List<CaseAttachment> attachments = request.getAttachments().stream().map(dto -> {
                try {
                    CaseAttachment attachment = new CaseAttachment();
                    attachment.setFileName(dto.getName());
                    attachment.setFileType(dto.getType());
                    attachment.setContent(java.util.Base64.getDecoder().decode(dto.getContent()));
                    attachment.setLegalCase(legalCase);
                    log.debug("Decoded attachment: {} ({} bytes)", dto.getName(), attachment.getContent().length);
                    return attachment;
                } catch (Exception e) {
                    log.error("Failed to decode attachment {}: {}", dto.getName(), e.getMessage());
                    throw new RuntimeException("Invalid attachment data: " + dto.getName());
                }
            }).collect(Collectors.toList());
            legalCase.setAttachments(attachments);
        }

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
    private final com.example.legalaid_backend.repository.MatchRepository matchRepository;

    // ... (constructor will auto-inject due to @RequiredArgsConstructor)

    // =========================
    // GET CASE BY ID (Authorized)
    // =========================
    public CaseResponse getCaseById(Long id) {

        User currentUser = getCurrentUser();

        // Check if user is the case owner (Citizen)
        if (currentUser.getRole() == Role.CITIZEN) {
            Case legalCase = caseRepository
                    .findByIdAndCreatedBy(id, currentUser)
                    .orElseThrow(() -> new RuntimeException("Case not found or access denied"));
            return toResponse(legalCase);
        }

        // Check if user is a provider (Lawyer/NGO)
        if (currentUser.getRole() == Role.LAWYER || currentUser.getRole() == Role.NGO) {
            // Verify if this provider has a match with this case
            boolean hasMatch = matchRepository.findByLegalCaseId(id).stream()
                    .anyMatch(m -> (m.getLawyer() != null && m.getLawyer().getId().equals(currentUser.getId())) ||
                            (m.getNgo() != null && m.getNgo().getId().equals(currentUser.getId())));

            if (hasMatch) {
                Case legalCase = caseRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Case not found"));
                return toResponse(legalCase);
            }
        }

        throw new RuntimeException("Access denied: You do not have permission to view this case");
    }

    // =========================
    // UPDATE CASE (CITIZEN)
    // =========================
    @Transactional
    public CaseResponse updateCase(Long id, CreateCaseRequest request) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.CITIZEN) {
            throw new RuntimeException("Only citizens can update cases");
        }

        Case legalCase = caseRepository
                .findByIdAndCreatedBy(id, currentUser)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        // Only allow editing cases with SUBMITTED status
        if (!"SUBMITTED".equalsIgnoreCase(legalCase.getStatus())) {
            throw new RuntimeException("Cannot edit case with status: " + legalCase.getStatus());
        }

        // Update case fields
        legalCase.setTitle(request.getTitle());
        legalCase.setDescription(request.getDescription());
        legalCase.setCaseType(request.getCaseType());
        legalCase.setPriority(request.getPriority());
        legalCase.setLocation(request.getLocation());
        legalCase.setPreferredLanguage(request.getPreferredLanguage());
        legalCase.setExpertiseTags(request.getExpertiseTags());

        log.info("Updated case ID {} by user {}", id, currentUser.getEmail());

        return toResponse(caseRepository.save(legalCase));
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
        response.setLocation(legalCase.getLocation());
        response.setPreferredLanguage(legalCase.getPreferredLanguage());
        response.setExpertiseTags(legalCase.getExpertiseTags());
        response.setCreatedBy(legalCase.getCreatedBy().getId());
        response.setCreatedAt(legalCase.getCreatedAt());
        response.setUpdatedAt(legalCase.getUpdatedAt());

        // Map Attachments
        if (legalCase.getAttachments() != null) {
            response.setAttachments(legalCase.getAttachments().stream().map(attachment -> {
                AttachmentDTO dto = new AttachmentDTO();
                dto.setName(attachment.getFileName());
                dto.setType(attachment.getFileType());
                dto.setContent(java.util.Base64.getEncoder().encodeToString(attachment.getContent()));
                return dto;
            }).collect(Collectors.toList()));
        }

        return response;
    }
}
