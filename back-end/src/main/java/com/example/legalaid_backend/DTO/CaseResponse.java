package com.example.legalaid_backend.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CaseResponse {

    private Long id;
    private String title;
    private String description;
    private String caseType;
    private String priority;
    private String status;

    private Long createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
