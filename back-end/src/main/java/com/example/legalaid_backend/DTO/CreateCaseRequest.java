package com.example.legalaid_backend.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCaseRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String caseType; // Criminal, Civil, Family, etc.

    private String priority; // LOW, MEDIUM, HIGH
}
