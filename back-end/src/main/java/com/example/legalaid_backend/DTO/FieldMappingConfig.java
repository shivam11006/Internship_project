package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldMappingConfig {
    private Map<String, String> fieldMapping; // CSV column -> Our field
    // Example: {"name": "username", "license_no": "barNumber", "area": "specialization"}
}
