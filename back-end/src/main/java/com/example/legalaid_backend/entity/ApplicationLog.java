package com.example.legalaid_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "application_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, length = 10)
    private String level; // INFO, WARN, ERROR, DEBUG, TRACE

    @Column(nullable = false, length = 500)
    private String logger; // Logger name (class name)

    @Column(columnDefinition = "TEXT")
    private String message; // Log message

    @Column(length = 200)
    private String threadName; // Thread that generated the log

    @Column(columnDefinition = "TEXT")
    private String exception; // Exception stacktrace if any

    @Column(length = 100)
    private String username; // Optional: user who triggered the action

    @Column(length = 50)
    private String endpoint; // Optional: API endpoint
}
