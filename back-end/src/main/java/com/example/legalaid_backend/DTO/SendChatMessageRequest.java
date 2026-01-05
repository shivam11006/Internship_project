package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendChatMessageRequest {
    private Long matchId;
    private String content;
    private String messageType = "TEXT";
}
