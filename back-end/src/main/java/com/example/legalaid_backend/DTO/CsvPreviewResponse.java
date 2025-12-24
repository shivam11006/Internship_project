package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class CsvPreviewResponse {
    private List<String> detectedHeaders;           // Headers found in CSV
    private List<String> requiredFields;             // Fields we need
    private Map<String, String> suggestedMapping;    // Auto-detected mapping
    private List<Map<String, String>> sampleRows;   // First 5 rows for preview
    private int totalRows;
}
