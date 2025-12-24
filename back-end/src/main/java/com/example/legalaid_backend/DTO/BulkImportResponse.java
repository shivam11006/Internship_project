package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<ImportResultRow> results;
    private String message;
}
