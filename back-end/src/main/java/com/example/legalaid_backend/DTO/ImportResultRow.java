package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultRow {
    private String username;
    private String email;
    private String generatedPassword;  // Only if credentials were generated
    private boolean success;
    private String errorMessage;
}
