package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlexibleImportRequest {

    private List<Map<String, String>> rows;         // Each row as key-value pairs
    private FieldMappingConfig mapping;             // How to interpret the data
    private String role;                             // "LAWYER" or "NGO"
    private String defaultPassword;                  // Same for all users
    private boolean autoApprove = true;
    private boolean generateEmails = true;
}
