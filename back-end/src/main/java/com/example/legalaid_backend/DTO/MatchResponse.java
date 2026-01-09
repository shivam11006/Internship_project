package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponse {
    private Long id;
    private Long caseId;
    private String caseNumber;
    private String caseTitle;
    private String caseType;
    private String caseLocation;
    private String caseDescription;
    private String casePriority;
    private String preferredLanguage;
    private List<String> expertiseTags;
    private Long providerId;
    private String providerName;
    private String providerType; // "LAWYER" or "NGO"
    private String providerSpecialization;
    private String providerLocation;
    private String status;
    private Double matchScore;
    private String matchReason;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime rejectedAt;
    private String citizenName;
    private String citizenEmail;
    private String citizenPhone;
    private List<AttachmentDTO> attachments;
}
