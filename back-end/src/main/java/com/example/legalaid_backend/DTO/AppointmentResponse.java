package com.example.legalaid_backend.DTO;

import com.example.legalaid_backend.util.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    
    private Long id;
    private Long matchId;
    private Long caseId;
    private String caseTitle;
    private String caseType;
    
    // Citizen info
    private Long citizenId;
    private String citizenName;
    private String citizenEmail;
    
    // Provider info
    private Long providerId;
    private String providerName;
    private String providerEmail;
    private String providerRole;
    
    // Appointment details (Offline meeting only)
    private LocalDateTime scheduledDateTime;
    private LocalTime appointmentTime;
    private String venue;
    private String location;
    private String address;
    private String notes;
    private String agenda;
    
    // Status
    private AppointmentStatus status;
    private Boolean citizenConfirmed;
    private Boolean providerConfirmed;
    
    // Action required info
    private Boolean actionRequiredByCitizen;
    private Boolean actionRequiredByProvider;
    private String statusDescription;
    
    // Cancellation info
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private String cancelledByName;
    
    // Completion info
    private LocalDateTime completedAt;
    private String completionNotes;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByName;
}
