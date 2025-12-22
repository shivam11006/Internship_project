package com.example.legalaid_backend.DTO;

import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;       // Short-lived (1 hour)
    private String refreshToken;      // Long-lived (7 days)
    private String tokenType = "Bearer";  // Token type (always "Bearer" for JWT)

    private Long id;
    private String username;
    private String email;
    private Role role;
    private ApprovalStatus status;
}
