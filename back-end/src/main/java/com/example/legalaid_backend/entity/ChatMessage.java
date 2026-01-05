package com.example.legalaid_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * ChatMessage Entity
 *
 * Represents a message between citizen and provider (lawyer/NGO)
 * Chat is only available when match status is SELECTED_BY_CITIZEN or ACCEPTED_BY_PROVIDER
 */
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_match_id", columnList = "match_id"),
        @Index(name = "idx_sender_id", columnList = "sender_id"),
        @Index(name = "idx_sent_at", columnList = "sent_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the match (case + provider relationship)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    // Who sent this message
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    // Message content
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Message type (for future expansion)
    @Column(nullable = false, length = 20)
    private String messageType = "TEXT"; // TEXT, IMAGE, FILE, SYSTEM

    // Read status
    @Column(nullable = false)
    private boolean isRead = false;

    // Timestamps
    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime sentAt;

    @Column
    private LocalDateTime readAt;

    @Column
    private LocalDateTime editedAt;

    // Soft delete (for data retention)
    @Column(nullable = false)
    private boolean deleted = false;
}
