package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LawyerImportV2Request {
    private List<Map<String, String>> data;        // Raw CSV data (flexible format)
    private Map<String, String> fieldMapping;      // How to map fields
    private String defaultPassword = "lawyer123";   // Same password for all
    private boolean autoApprove = true;
}
