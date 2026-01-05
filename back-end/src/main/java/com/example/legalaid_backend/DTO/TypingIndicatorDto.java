package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingIndicatorDto {
    private Long matchId;
    private Long userId;
    private String userName;
    private boolean isTyping;

}
