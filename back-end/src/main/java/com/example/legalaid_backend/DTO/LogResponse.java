package com.example.legalaid_backend.DTO;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogResponse {
    private Long id;
    private LocalDateTime timestamp;
    private String level;
    private String logger;
    private String message;
    private String threadName;
    private String exception;
    private String username;
    private String endpoint;
}
