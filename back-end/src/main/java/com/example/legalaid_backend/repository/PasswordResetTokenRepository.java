package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.PasswordResetToken;
import com.example.legalaid_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    void deleteByUser(User user);
    
    void deleteByExpiryDateBefore(java.time.LocalDateTime now);
    
    // Find by user email and OTP for verification
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user.email = :email AND t.otp = :otp AND t.used = false")
    Optional<PasswordResetToken> findByUserEmailAndOtp(@Param("email") String email, @Param("otp") String otp);
    
    // Find latest token by user email (for resend functionality)
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user.email = :email AND t.used = false ORDER BY t.createdAt DESC")
    Optional<PasswordResetToken> findLatestByUserEmail(@Param("email") String email);
    
    // Find verified token by email for password reset
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user.email = :email AND t.otpVerified = true AND t.used = false")
    Optional<PasswordResetToken> findVerifiedTokenByEmail(@Param("email") String email);
}
