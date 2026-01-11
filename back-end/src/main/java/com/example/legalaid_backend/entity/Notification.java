package com.example.legalaid_backend.entity;

import com.example.legalaid_backend.util.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_user_read", columnList = "user_id,is_read"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    // Related entity IDs for navigation
    @Column(name = "match_id")
    private Long matchId;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "case_id")
    private Long caseId;

    @Column(name = "chat_message_id")
    private Long chatMessageId;

    @Column(name = "related_user_id")
    private Long relatedUserId;

    // Action URL for the notification
    @Column(length = 500)
    private String actionUrl;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    // Custom constructor for quick creation
    public Notification(User user, NotificationType type, String title, String message) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.read = false;
    }
}
