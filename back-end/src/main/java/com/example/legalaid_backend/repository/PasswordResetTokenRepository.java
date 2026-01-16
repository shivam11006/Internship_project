package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.PasswordResetToken;
import com.example.legalaid_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    void deleteByUser(User user);
    
    void deleteByExpiryDateBefore(java.time.LocalDateTime now);
}
