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

public class ChatConversationDto {
    private Long matchId;
    private Long caseId;
    private String caseTitle;
    private String caseType;
    private String matchStatus; // SELECTED_BY_CITIZEN, ACCEPTED_BY_PROVIDER, etc.

    // Other participant info
    private Long otherUserId;
    private String otherUserName;
    private String otherUserRole; // CITIZEN, LAWYER, NGO

    // Chat preview
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private int unreadCount;

    // Chat status
    private boolean canChat; // Based on match status
    private LocalDateTime createdAt;
}
