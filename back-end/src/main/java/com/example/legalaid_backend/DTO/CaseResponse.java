package com.example.legalaid_backend.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CaseResponse {

    private Long id;
    private String caseNumber;
    private String title;
    private String description;
    private String caseType;
    private String priority;
    private String status;
    private String location;
    private String preferredLanguage;
    private java.util.List<String> expertiseTags;
    private java.util.List<AttachmentDTO> attachments;

    private Long createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
