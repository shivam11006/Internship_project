package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCaseResponse {

    private Long id;
    private String caseNumber;
    private String title;
    private String description;
    private String caseType;
    private String priority;
    private String status;
    private String location;
    private String preferredLanguage;
    private List<String> expertiseTags;

    // Creator information
    private Long createdById;
    private String createdByUsername;
    private String createdByEmail;

    // Assigned Provider information (Lawyer/NGO who accepted the case)
    private Long assignedProviderId;
    private String assignedProviderUsername;
    private String assignedProviderEmail;
    private String assignedProviderRole; // LAWYER or NGO
    private LocalDateTime assignedAt;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Statistics for admin view
    private int attachmentCount;
    private int matchCount;
}
