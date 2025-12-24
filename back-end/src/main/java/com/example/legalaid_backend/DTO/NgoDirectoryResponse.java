package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NgoDirectoryResponse {
    private Long userId;
    private String username;
    private String email;
    private String address;
    private String location;
    private String organizationName;
    private String registrationNumber;
    private String focusArea;
    private boolean verified; // Based on ApprovalStatus.APPROVED
}
