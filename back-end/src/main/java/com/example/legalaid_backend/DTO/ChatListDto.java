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
public class ChatListDto {
    private List<ChatConversationDto> conversations;
    private int totalConversations;
    private int totalUnreadMessages;
}
