package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LawyerDirectoryResponse {
    private Long userId;
    private String username;
    private String email;
    private String barNumber;
    private String specialization;
    private boolean verified; // Based on ApprovalStatus.APPROVED
}
