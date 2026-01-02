package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResultDTO {
    private String source; // "REGISTERED"
    private String providerType; // "LAWYER" or "NGO"
    private Long matchId;
    private String name;
    private String city;
    private String expertise; // specialization or focusArea
    private Double score;
    private Boolean verified;
    private Boolean canInteract;
}
