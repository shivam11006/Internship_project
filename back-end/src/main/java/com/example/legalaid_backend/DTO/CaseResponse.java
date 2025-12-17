package com.example.legalaid_backend.DTO;

import com.example.legalaid_backend.util.CasePriority;
import com.example.legalaid_backend.util.CaseStatus;
import com.example.legalaid_backend.util.CaseType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder   // ⭐ THIS WAS MISSING
@NoArgsConstructor
@AllArgsConstructor
public class CaseResponse {

    private Long id;
    private String title;
    private String description;
    private CaseType caseType;
    private CasePriority priority;
    private CaseStatus status;

    private Long createdBy;
    private Long assignedTo;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
