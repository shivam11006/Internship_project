package com.example.legalaid_backend.DTO;

import lombok.Data;

@Data
public class CreateCaseRequest {

    private String title;
    private String description;
    private String caseType;
    private String priority;
}

