package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusUpdateRequest {

    private Boolean enabled;
    private String approvalStatus; // PENDING, APPROVED, REJECTED, SUSPENDED, REAPPROVAL_PENDING
    private String reason; // Optional reason for status change
}
