package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.RegisterRequest;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.entity.LawyerProfile;
import com.example.legalaid_backend.entity.NgoProfile;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.LawyerProfileRepository;
import com.example.legalaid_backend.repository.NgoProfileRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.Role;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final LawyerProfileRepository lawyerProfileRepository;
    private final NgoProfileRepository ngoProfileRepository;

    // ======================================
    // REGISTER USER
    // ======================================
    @Transactional
    public UserResponse registerUser(RegisterRequest request) {

        logger.info("Attempting to register new user with email: {}", request.getEmail());

        // Duplicate check
        if (userRepository.existsByEmail(request.getEmail())) {
            logger.warn("Registration failed: Email {} already exists", request.getEmail());
            throw new RuntimeException("Email already registered");
        }

        // Create user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());  // plaintext—not recommended, but your current logic
        user.setRole(request.getRole());

        logger.info("Saving user {} with role {}", request.getEmail(), request.getRole());
        user = userRepository.save(user);

        // Create profile based on role
        Object profile = null;
        if (request.getRole() == Role.LAWYER) {
            logger.info("Creating lawyer profile for {}", request.getEmail());
            profile = createLawyerProfile(user, request);

        } else if (request.getRole() == Role.NGO) {
            logger.info("Creating NGO profile for {}", request.getEmail());
            profile = createNgoProfile(user, request);
        }

        logger.info("User registered successfully with ID {}", user.getId());
        return convertToResponse(user, profile);
    }


    // ======================================
    // GET ALL USERS
    // ======================================
    public List<UserResponse> getAllUsers() {

        logger.info("Fetching all users from database");

        List<UserResponse> users = userRepository.findAll().stream()
                .map(user -> {
                    Object profile = getProfileForUser(user);
                    return convertToResponse(user, profile);
                })
                .collect(Collectors.toList());

        logger.info("Fetched {} users", users.size());

        return users;
    }


    // ======================================
    // GET USER BY ID
    // ======================================
    public UserResponse getUserById(Long id) {

        logger.info("Fetching user by ID {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("User not found with ID {}", id);
                    return new RuntimeException("User not found");
                });

        Object profile = getProfileForUser(user);

        logger.info("Returning user {} with profile type {}", id,
                (profile != null ? profile.getClass().getSimpleName() : "None"));

        return convertToResponse(user, profile);
    }


    // ======================================
    // GET USER BY EMAIL
    // ======================================
    public UserResponse getUserByEmail(String email) {

        logger.info("Fetching user by email {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("User not found with email {}", email);
                    return new RuntimeException("User not found");
                });

        Object profile = getProfileForUser(user);

        logger.info("Returning user {} with profile type {}", email,
                (profile != null ? profile.getClass().getSimpleName() : "None"));

        return convertToResponse(user, profile);
    }


    // ======================================
    // DELETE USER
    // ======================================
    @Transactional
    public void deleteUser(Long id) {

        logger.info("Attempting to delete user with ID {}", id);

        if (!userRepository.existsById(id)) {
            logger.error("Delete failed: User with ID {} does not exist", id);
            throw new RuntimeException("User not found");
        }

        userRepository.deleteById(id);
        logger.info("User with ID {} deleted successfully", id);
    }


    // ======================================
    // PROFILE CREATION HELPERS
    // ======================================
    private LawyerProfile createLawyerProfile(User user, RegisterRequest request) {

        logger.info("Saving lawyer profile for {}", user.getEmail());

        LawyerProfile profile = new LawyerProfile();
        profile.setUser(user);
        profile.setSpecialization(request.getSpecialization());
        profile.setBarNumber(request.getBarNumber());
        profile.setYearsOfExperience(request.getYearsOfExperience());

        return lawyerProfileRepository.save(profile);
    }

    private NgoProfile createNgoProfile(User user, RegisterRequest request) {

        logger.info("Saving NGO profile for {}", user.getEmail());

        NgoProfile profile = new NgoProfile();
        profile.setUser(user);
        profile.setRegistrationNumber(request.getRegistrationNumber());

        return ngoProfileRepository.save(profile);
    }


    // ======================================
    // PROFILE FETCHER
    // ======================================
    private Object getProfileForUser(User user) {

        if (user.getRole() == Role.LAWYER) {
            logger.debug("Fetching lawyer profile for {}", user.getEmail());
            return lawyerProfileRepository.findByUserId(user.getId()).orElse(null);

        } else if (user.getRole() == Role.NGO) {
            logger.debug("Fetching NGO profile for {}", user.getEmail());
            return ngoProfileRepository.findByUserId(user.getId()).orElse(null);
        }

        return null;
    }


    // ======================================
    // CONVERSION TO RESPONSE DTO
    // ======================================
    private UserResponse convertToResponse(User user, Object profile) {

        logger.debug("Converting user {} to UserResponse DTO", user.getEmail());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .profile(profile)
                .enabled(user.isEnabled())
                .approvalStatus(user.getApprovalStatus())
                .build();
    }
}
