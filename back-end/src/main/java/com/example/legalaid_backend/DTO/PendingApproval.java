package com.example.legalaid_backend.DTO;

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
public class PendingApproval {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private LocalDateTime createdAt;

    // Lawyer-specific info
    private String barNumber;
    private String specialization;

    // NGO-specific info
    private String organizationName;
    private String registrationNumber;
    private String focusArea;
}
