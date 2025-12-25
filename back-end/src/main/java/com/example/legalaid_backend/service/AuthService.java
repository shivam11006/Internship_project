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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final LawyerProfileRepository lawyerProfileRepository;
    private final NgoProfileRepository ngoProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    // ============================
    //        REGISTER USER
    // ============================
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        logger.info("Registration attempt for email: {}", request.getEmail());

        // Validate unique email
        if (userRepository.existsByEmail(request.getEmail())) {
            logger.warn("Registration failed: email {} is already registered", request.getEmail());
            throw new RuntimeException("Email already registered");
        }

        logger.info("Creating new user: {}", request.getEmail());

        // Create user with encrypted password
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setEnabled(true);

        // Set location from request
        user.setLocation(request.getLocation());

        // Set approval based on role
        if (request.getRole() == Role.CITIZEN || request.getRole() == Role.ADMIN) {
            user.setApprovalStatus(ApprovalStatus.APPROVED);
            logger.info("User {} auto-approved (Citizen/Admin)", request.getEmail());
        } else {
            user.setApprovalStatus(ApprovalStatus.PENDING);
            logger.info("User {} requires admin approval (LAWYER/NGO)", request.getEmail());
        }

        // Save user
        user = userRepository.save(user);
        logger.info("User {} saved with ID {}", request.getEmail(), user.getId());

        // Create profiles for lawyers / NGOs
        if (request.getRole() == Role.LAWYER) {
            logger.info("Creating lawyer profile for {}", request.getEmail());
            createLawyerProfile(user, request);

        } else if (request.getRole() == Role.NGO) {
            logger.info("Creating NGO profile for {}", request.getEmail());
            createNgoProfile(user, request);
        }

        // Authenticate user immediately after register
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        logger.info("User {} authenticated after registration", request.getEmail());

        // Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        logger.info("JWT tokens generated for {}", request.getEmail());

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


    // ============================
    //            LOGIN
    // ============================
    public AuthResponse login(LoginRequest request) {

        logger.info("Login attempt for email: {}", request.getEmail());

        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        logger.info("User {} authenticated successfully", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.error("Login failed: user {} not found", request.getEmail());
                    return new RuntimeException("User not found");
                });

        logger.info("Generating tokens for {}", request.getEmail());

        // Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        logger.info("Tokens generated successfully for {}", request.getEmail());

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


    // ============================
    //       REFRESH TOKEN
    // ============================
    public AuthResponse refreshToken(String refreshToken) {

        logger.info("Refresh token request received");

        // Validate token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            logger.error("Refresh token validation failed: invalid or expired");
            throw new RuntimeException("Invalid or expired refresh token");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        logger.info("Refresh token belongs to {}", email);

        // Load user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Refresh token failed: user {} not found", email);
                    return new RuntimeException("User not found");
                });

        logger.info("Generating new tokens for {}", email);

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                new UsernamePasswordAuthenticationToken(email, null)
        );
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

        logger.info("New tokens generated for {}", email);

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


    // ============================
    //    PROFILE CREATION HELPERS
    // ============================
    private LawyerProfile createLawyerProfile(User user, RegisterRequest request) {
        logger.info("Saving lawyer profile for {}", user.getEmail());
        LawyerProfile profile = new LawyerProfile();
        profile.setUser(user);
        profile.setSpecialization(request.getSpecialization());
        profile.setBarNumber(request.getBarNumber());
        profile.setAddress(request.getAddress());
        profile.setLanguages(request.getLanguages());
        return lawyerProfileRepository.save(profile);
    }

    private NgoProfile createNgoProfile(User user, RegisterRequest request) {
        logger.info("Saving NGO profile for {}", user.getEmail());
        NgoProfile profile = new NgoProfile();
        profile.setUser(user);
        profile.setRegistrationNumber(request.getRegistrationNumber());
        profile.setOrganizationName(request.getOrganizationName());
        profile.setFocusArea(request.getFocusArea());
        profile.setAddress(request.getAddress());
        profile.setLanguages(request.getLanguages());
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

