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
public class ChatHistoryDto {
    private Long matchId;
    private List<ChatMessageDto> messages;
    private int totalMessages;
    private int unreadCount;
    private boolean hasMore;
    private int currentPage;
}
