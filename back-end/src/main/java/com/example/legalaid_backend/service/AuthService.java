package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.entity.LawyerProfile;
import com.example.legalaid_backend.entity.NgoProfile;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.LawyerProfileRepository;
import com.example.legalaid_backend.repository.NgoProfileRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.security.JwtTokenProvider;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final LawyerProfileRepository lawyerProfileRepository;
    private final NgoProfileRepository ngoProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;  // ⭐ NEW: JWT Provider

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate unique email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create user with encrypted password
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        // Set approval status based on role
        if (request.getRole() == Role.CITIZEN || request.getRole() == Role.ADMIN) {
            // Citizens and Admins are auto-approved
            user.setApprovalStatus(ApprovalStatus.APPROVED);
        } else {
            // Lawyers and NGOs need admin approval
            user.setApprovalStatus(ApprovalStatus.PENDING);
        }

        user.setEnabled(true);

        // Save user
        user = userRepository.save(user);

        // Create role-specific profile
        if (request.getRole() == Role.LAWYER) {
            createLawyerProfile(user, request);
        } else if (request.getRole() == Role.NGO) {
            createNgoProfile(user, request);
        }

        // Authenticate and generate tokens
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        // Return tokens
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }


    public AuthResponse login(LoginRequest request) {
        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Get user details
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        // Return tokens in response
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid or expired refresh token");
        }

        // Extract email from token
        String email = jwtTokenProvider.getEmailFromToken(refreshToken);

        // Load user from database
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate new tokens
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                new UsernamePasswordAuthenticationToken(email, null)
        );
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

        // Return new tokens
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private LawyerProfile createLawyerProfile(User user, RegisterRequest request) {
        LawyerProfile profile = new LawyerProfile();
        profile.setUser(user);
        profile.setSpecialization(request.getSpecialization());
        profile.setBarNumber(request.getBarNumber());
        return lawyerProfileRepository.save(profile);
    }

    private NgoProfile createNgoProfile(User user, RegisterRequest request) {
        NgoProfile profile = new NgoProfile();
        profile.setUser(user);
        profile.setRegistrationNumber(request.getRegistrationNumber());
        profile.setOrganizationName(request.getOrganizationName());
        profile.setFocusArea(request.getFocusArea());
        return ngoProfileRepository.save(profile);
    }

    private Object getProfileForUser(User user) {
        if (user.getRole() == Role.LAWYER) {
            return lawyerProfileRepository.findByUserId(user.getId()).orElse(null);
        } else if (user.getRole() == Role.NGO) {
            return ngoProfileRepository.findByUserId(user.getId()).orElse(null);
        }
        return null;
    }

    private UserResponse convertToResponse(User user, Object profile) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
