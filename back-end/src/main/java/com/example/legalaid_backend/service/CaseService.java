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

        // Generate custom case number: 100 + userId + sequentialCaseNumber
        long userCaseCount = caseRepository.countByCreatedBy(currentUser) + 1;
        String caseNumber = generateCaseNumber(currentUser.getId(), userCaseCount);
        legalCase.setCaseNumber(caseNumber);

        // Handle Attachments
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            log.info("Processing {} attachments for new case", request.getAttachments().size());
            java.util.List<CaseAttachment> attachments = request.getAttachments().stream().map(dto -> {
                try {
                    CaseAttachment attachment = new CaseAttachment();
                    // Support both old (name/type) and new (fileName/fileType) field names
                    String fileName = dto.getFileName() != null ? dto.getFileName() : dto.getName();
                    String fileType = dto.getFileType() != null ? dto.getFileType() : dto.getType();
                    attachment.setFileName(fileName);
                    attachment.setFileType(fileType);
                    attachment.setContent(java.util.Base64.getDecoder().decode(dto.getContent()));
                    attachment.setLegalCase(legalCase);
                    log.debug("Decoded attachment: {} ({} bytes)", fileName, attachment.getContent().length);
                    return attachment;
                } catch (Exception e) {
                    log.error("Failed to decode attachment: {}", e.getMessage());
                    throw new RuntimeException("Invalid attachment data");
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
    // UPDATE CASE STATUS (LAWYER/NGO/CITIZEN)
    // =========================
    @Transactional
    public CaseResponse updateCaseStatus(Long id, String newStatus) {

        User currentUser = getCurrentUser();

        Case legalCase = caseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        // Citizens can only resolve their own cases
        if (currentUser.getRole() == Role.CITIZEN) {
            // Check if the citizen owns this case
            if (!legalCase.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Access denied: You can only update your own cases");
            }
            
            // Citizens can only mark cases as RESOLVED
            if (!newStatus.equals("RESOLVED")) {
                throw new RuntimeException("Citizens can only mark cases as RESOLVED");
            }
            
            // Citizens can only resolve cases that are ACCEPTED, IN_PROGRESS, or UNDER_REVIEW
            String currentStatus = legalCase.getStatus();
            if (!currentStatus.equals("ACCEPTED") && !currentStatus.equals("IN_PROGRESS") && !currentStatus.equals("UNDER_REVIEW")) {
                throw new RuntimeException("Can only resolve cases that are ACCEPTED, IN_PROGRESS, or UNDER_REVIEW. Current status: " + currentStatus);
            }
            
            legalCase.setStatus(newStatus);
            log.info("Case ID {} status updated to RESOLVED by citizen {}",
                    id, currentUser.getEmail());
            
            return toResponse(caseRepository.save(legalCase));
        }

        // Only lawyers and NGOs can update case status to other values
        if (currentUser.getRole() != Role.LAWYER && currentUser.getRole() != Role.NGO) {
            throw new RuntimeException("Only lawyers, NGOs, or case owners (citizens) can update case status");
        }

        // Verify that the user is assigned to this case (has an accepted match)
        boolean hasAcceptedMatch = matchRepository.findByLegalCaseId(id).stream()
                .anyMatch(m -> m.getStatus() == com.example.legalaid_backend.util.MatchStatus.ACCEPTED_BY_PROVIDER &&
                        ((m.getLawyer() != null && m.getLawyer().getId().equals(currentUser.getId())) ||
                         (m.getNgo() != null && m.getNgo().getId().equals(currentUser.getId()))));

        if (!hasAcceptedMatch) {
            throw new RuntimeException("Access denied: You are not assigned to this case");
        }

        // Validate status transition
        String currentStatus = legalCase.getStatus();
        if (!isValidStatusTransition(currentStatus, newStatus)) {
            throw new RuntimeException("Invalid status transition from " + currentStatus + " to " + newStatus);
        }

        legalCase.setStatus(newStatus);

        log.info("Case ID {} status updated from {} to {} by user {}",
                id, currentStatus, newStatus, currentUser.getEmail());

        return toResponse(caseRepository.save(legalCase));
    }

    // =========================
    // VALIDATE STATUS TRANSITION
    // =========================
    private boolean isValidStatusTransition(String currentStatus, String newStatus) {
        // Define valid transitions
        if (currentStatus.equals("ACCEPTED") && 
            (newStatus.equals("IN_PROGRESS") || newStatus.equals("UNDER_REVIEW"))) {
            return true;
        }
        if (currentStatus.equals("IN_PROGRESS") && 
            (newStatus.equals("UNDER_REVIEW") || newStatus.equals("RESOLVED"))) {
            return true;
        }
        if (currentStatus.equals("UNDER_REVIEW") && 
            (newStatus.equals("IN_PROGRESS") || newStatus.equals("RESOLVED"))) {
            return true;
        }
        if (currentStatus.equals("RESOLVED") && newStatus.equals("CLOSED")) {
            return true;
        }
        return false;
    }

    // =========================
    // HELPERS
    // =========================
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Generates a custom case number in format: 100 + userId (2 digits) + sequentialNumber (2 digits)
     * Example: User ID 2, Case 1 -> 10021
     *          User ID 2, Case 2 -> 10022
     *          User ID 15, Case 3 -> 101503
     */
    private String generateCaseNumber(Long userId, long caseSequence) {
        // Format: 100 + userId (padded to at least 2 digits) + case sequence (padded to at least 2 digits)
        String userIdPart = String.format("%02d", userId);
        String sequencePart = String.format("%02d", caseSequence);
        return "100" + userIdPart + sequencePart;
    }

    private CaseResponse toResponse(Case legalCase) {

        CaseResponse response = new CaseResponse();
        response.setId(legalCase.getId());
        response.setCaseNumber(legalCase.getCaseNumber());
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
                dto.setId(attachment.getId());
                dto.setFileName(attachment.getFileName());
                dto.setFileType(attachment.getFileType());
                dto.setFileSize(attachment.getContent() != null ? (long) attachment.getContent().length : 0L);
                dto.setContent(java.util.Base64.getEncoder().encodeToString(attachment.getContent()));
                return dto;
            }).collect(Collectors.toList()));
        }

        return response;
    }
}
