package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private List<NotificationDTO> notifications;
    private long unreadCount;
    private int totalCount;
}
