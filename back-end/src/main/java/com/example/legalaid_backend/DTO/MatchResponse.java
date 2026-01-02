package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponse {
    private Long id;
    private Long caseId;
    private String caseTitle;
    private String caseType;
    private String caseLocation;
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
}
