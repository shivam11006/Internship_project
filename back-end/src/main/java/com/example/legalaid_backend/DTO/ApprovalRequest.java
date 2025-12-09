package com.example.legalaid_backend.DTO;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApprovalRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Approval decision is required")
    private Boolean approved;  // true = approve, false = reject

}