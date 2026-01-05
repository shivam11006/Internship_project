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
public class ChatMessageDto {
    private Long id;
    private Long matchId;

    // Sender info
    private Long senderId;
    private String senderName;
    private String senderRole; // CITIZEN, LAWYER, NGO

    // Message data
    private String content;
    private String messageType;

    // Status
    private boolean isRead;
    private boolean isOwnMessage;

    // Timestamps
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private LocalDateTime editedAt;
}
