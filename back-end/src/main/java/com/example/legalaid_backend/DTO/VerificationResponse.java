package com.example.legalaid_backend.DTO;

import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResponse {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private ApprovalStatus approvalStatus;
    private LocalDateTime createdAt;
    private boolean enabled;

    // Lawyer specific fields
    private String barNumber;
    private String specialization;

    // NGO specific fields
    private String organizationName;
    private String registrationNumber;
    private String focusArea;

    // Location and languages
    private String location;
    private String languages;
    private String address;
}
