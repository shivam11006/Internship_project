package com.example.legalaid_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = true)
    private String token;
    
    // 6-digit OTP for email verification (nullable for backward compatibility)
    @Column(length = 6)
    private String otp;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private LocalDateTime expiryDate;
    
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean used = false;
    
    // Track OTP verification attempts to prevent brute force
    @Column(columnDefinition = "integer default 0")
    private int attempts = 0;
    
    // Whether OTP has been verified (step 1 complete)
    @Column(columnDefinition = "boolean default false")
    private boolean otpVerified = false;
    
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }
    
    public void incrementAttempts() {
        this.attempts++;
    }
    
    public boolean hasExceededMaxAttempts(int maxAttempts) {
        return this.attempts >= maxAttempts;
    }
}
