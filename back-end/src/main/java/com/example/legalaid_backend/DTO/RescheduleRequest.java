package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleRequest {
    
    private LocalDateTime preferredDateTime;  // Citizen's preferred new time
    private String reason;                    // Reason for reschedule request
    private String message;                   // Optional message to provider
}
