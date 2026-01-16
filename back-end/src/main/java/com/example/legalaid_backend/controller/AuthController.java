package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * REGISTER NEW USER
     * POST /api/auth/register
     * Public endpoint
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        MDC.put("username", request.getEmail());
        MDC.put("endpoint", "/api/auth/register");

        try {
            log.info("Registration request received for email: {}, role: {}",
                    request.getEmail(), request.getRole());

            AuthResponse response = authService.register(request);

            log.info("User registered successfully: {}, role: {}, status: {}",
                    request.getEmail(),
                    request.getRole(),
                    response.getStatus());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Registration failed for email {}: {}", request.getEmail(), e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * LOGIN USER
     * POST /api/auth/login
     * Public endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        MDC.put("username", request.getEmail());
        MDC.put("endpoint", "/api/auth/login");

        try {
            String clientIp = httpRequest.getRemoteAddr();
            log.info("Login attempt for email: {} from IP: {}", request.getEmail(), clientIp);

            AuthResponse response = authService.login(request);

            log.info("Login successful for email: {}, role: {}",
                    request.getEmail(),
                    response.getRole());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.warn("Login failed for email {}: {}", request.getEmail(), e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * REFRESH TOKEN
     * POST /api/auth/refresh-token
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        MDC.put("username", "token-refresh");
        MDC.put("endpoint", "/api/auth/refresh-token");

        try {
            log.info("Refresh token request received");

            AuthResponse response = authService.refreshToken(request.getRefreshToken());

            log.info("Access token refreshed successfully for user: {}", response.getEmail());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.warn("Failed to refresh token: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid or expired refresh token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * FORGOT PASSWORD
     * POST /api/auth/forgot-password
     * Public endpoint
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        MDC.put("username", request.getEmail());
        MDC.put("endpoint", "/api/auth/forgot-password");

        try {
            log.info("Forgot password request received for email: {}", request.getEmail());

            authService.forgotPassword(request.getEmail());

            log.info("Password reset email sent to: {}", request.getEmail());

            Map<String, String> response = new HashMap<>();
            response.put("message", "If the email exists, a password reset link has been sent.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Forgot password failed for email {}: {}", request.getEmail(), e.getMessage());
            // Always return success to prevent email enumeration
            Map<String, String> response = new HashMap<>();
            response.put("message", "If the email exists, a password reset link has been sent.");
            return ResponseEntity.ok(response);
        } finally {
            MDC.clear();
        }
    }

    /**
     * RESET PASSWORD
     * POST /api/auth/reset-password
     * Public endpoint
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        MDC.put("username", "password-reset");
        MDC.put("endpoint", "/api/auth/reset-password");

        try {
            log.info("Reset password request received with token");

            authService.resetPassword(request.getToken(), request.getNewPassword());

            log.info("Password reset successful");

            Map<String, String> response = new HashMap<>();
            response.put("message", "Password has been reset successfully.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Reset password failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            MDC.clear();
        }
    }
}
