package com.example.legalaid_backend.DTO;

import com.example.legalaid_backend.util.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private String actionUrl;
    
    // Related IDs for client-side navigation
    private Long matchId;
    private Long appointmentId;
    private Long caseId;
    private Long chatMessageId;
    private Long relatedUserId;
}
