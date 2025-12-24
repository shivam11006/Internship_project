package com.example.legalaid_backend.DTO;

import lombok.Data;

@Data
public class ProfileUpdateRequest {

    private String username;

    // Common field
    private String location;

    // Lawyer-specific fields
    private String barNumber;              // ⚠️ CRUCIAL - triggers re-approval
    private String specialization;         // ⚠️ CRUCIAL - triggers re-approval
    private String address;

    // NGO-specific fields
    private String organizationName;       // ⚠️ CRUCIAL - triggers re-approval
    private String registrationNumber;     // ⚠️ CRUCIAL - triggers re-approval
    private String focusArea;              // ⚠️ CRUCIAL - triggers re-approval
}