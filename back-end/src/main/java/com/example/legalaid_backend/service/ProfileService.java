package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.ProfileUpdateRequest;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.entity.LawyerProfile;
import com.example.legalaid_backend.entity.NgoProfile;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.LawyerProfileRepository;
import com.example.legalaid_backend.repository.NgoProfileRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileService.class);

    private final UserRepository userRepository;
    private final LawyerProfileRepository lawyerProfileRepository;
    private final NgoProfileRepository ngoProfileRepository;

    // ============================
    // GET CURRENT USER
    // ============================
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        logger.info("Fetching current user profile for email: {}", email);

        return userRepository.findByEmailWithProfiles(email)
                .orElseThrow(() -> {
                    logger.error("User not found for email: {}", email);
                    return new RuntimeException("User not found");
                });
    }

    // ============================
    // GET PROFILE
    // ============================
    public UserResponse getProfile() {
        User user = getCurrentUser();

        logger.info("Building profile response for user ID {}", user.getId());

        Object profile = null;

        if (user.getRole() == Role.LAWYER && user.getLawyerProfile() != null) {
            profile = user.getLawyerProfile();
            logger.info("User {} is a LAWYER. Returning lawyer profile.", user.getEmail());
        }
        else if (user.getRole() == Role.NGO && user.getNgoProfile() != null) {
            profile = user.getNgoProfile();
            logger.info("User {} is an NGO. Returning NGO profile.", user.getEmail());
        }

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .location(user.getLocation())
                .createdAt(user.getCreatedAt())
                .profile(profile)
                .approvalStatus(user.getApprovalStatus())
                .enabled(user.isEnabled())
                .build();
    }

    // ============================
    // UPDATE PROFILE
    // ============================
    @Transactional
    public UserResponse updateProfile(ProfileUpdateRequest request) {
        User user = getCurrentUser();

        logger.info("Updating profile for user ID {}", user.getId());

        // Update common fields
        if (request.getUsername() != null) {
            logger.info("Updating username for user {} to {}", user.getEmail(), request.getUsername());
            user.setUsername(request.getUsername());
        }

        if (request.getLocation() != null) {
            logger.info("Updating location for user {} to {}", user.getEmail(), request.getLocation());
            user.setLocation(request.getLocation());
        }

        // Role-specific updates
        if (user.getRole() == Role.LAWYER) {
            logger.info("Updating LAWYER profile for {}", user.getEmail());
            updateLawyerProfileWithApprovalCheck(user, request);
        }
        else if (user.getRole() == Role.NGO) {
            logger.info("Updating NGO profile for {}", user.getEmail());
            updateNgoProfileWithApprovalCheck(user, request);
        }

        userRepository.save(user);
        logger.info("Profile update complete for user ID {}", user.getId());

        return getProfile();
    }

    // ============================
    // LAWYER PROFILE UPDATE
    // ============================
    private void updateLawyerProfileWithApprovalCheck(User user, ProfileUpdateRequest request) {
        LawyerProfile profile = user.getLawyerProfile();
        if (profile == null) {
            logger.warn("Lawyer profile missing for {} — creating new profile", user.getEmail());
            profile = new LawyerProfile();
            profile.setUser(user);
            user.setLawyerProfile(profile);
        }

        boolean crucialFieldChanged = false;

        // Bar Number (crucial)
        if (request.getBarNumber() != null &&
                !request.getBarNumber().equals(profile.getBarNumber())) {

            logger.info("Crucial field changed: BarNumber {} → {}", profile.getBarNumber(), request.getBarNumber());
            profile.setBarNumber(request.getBarNumber());
            crucialFieldChanged = true;
        }

        // Specialization (crucial)
        if (request.getSpecialization() != null &&
                !request.getSpecialization().equals(profile.getSpecialization())) {

            logger.info("Crucial field changed: Specialization {} → {}", profile.getSpecialization(), request.getSpecialization());
            profile.setSpecialization(request.getSpecialization());
            crucialFieldChanged = true;
        }

        // Address (non-crucial)
        if (request.getAddress() != null) {
            logger.info("Updating address for lawyer {} to {}", user.getEmail(), request.getAddress());
            profile.setAddress(request.getAddress());
        }

        // Languages (non-crucial)
        if (request.getLanguages() != null) {
            logger.info("Updating languages for lawyer {} to {}", user.getEmail(), request.getLanguages());
            profile.setLanguages(request.getLanguages());
        }

        // Trigger re-approval if needed
        if (crucialFieldChanged && user.getApprovalStatus() == ApprovalStatus.APPROVED) {
            logger.warn("Crucial lawyer field changed — setting user {} approval to REAPPROVAL_PENDING", user.getEmail());
            user.setApprovalStatus(ApprovalStatus.REAPPROVAL_PENDING);
        }

        lawyerProfileRepository.save(profile);
        logger.info("Lawyer profile updated for {}", user.getEmail());
    }

    // ============================
    // NGO PROFILE UPDATE
    // ============================
    private void updateNgoProfileWithApprovalCheck(User user, ProfileUpdateRequest request) {
        NgoProfile profile = user.getNgoProfile();

        if (profile == null) {
            logger.warn("NGO profile missing for {} — creating new profile", user.getEmail());
            profile = new NgoProfile();
            profile.setUser(user);
            user.setNgoProfile(profile);
        }

        boolean crucialFieldChanged = false;

        // Organization Name (crucial)
        if (request.getOrganizationName() != null &&
                !request.getOrganizationName().equals(profile.getOrganizationName())) {

            logger.info("Crucial field changed: OrgName {} → {}", profile.getOrganizationName(), request.getOrganizationName());
            profile.setOrganizationName(request.getOrganizationName());
            crucialFieldChanged = true;
        }

        // Registration Number (crucial)
        if (request.getRegistrationNumber() != null &&
                !request.getRegistrationNumber().equals(profile.getRegistrationNumber())) {

            logger.info("Crucial field changed: RegistrationNumber {} → {}", profile.getRegistrationNumber(), request.getRegistrationNumber());
            profile.setRegistrationNumber(request.getRegistrationNumber());
            crucialFieldChanged = true;
        }

        // Focus Area (crucial)
        if (request.getFocusArea() != null &&
                !request.getFocusArea().equals(profile.getFocusArea())) {

            logger.info("Crucial field changed: FocusArea {} → {}", profile.getFocusArea(), request.getFocusArea());
            profile.setFocusArea(request.getFocusArea());
            crucialFieldChanged = true;
        }

        // Address (non-crucial)
        if (request.getAddress() != null) {
            logger.info("Updating address for NGO {} to {}", user.getEmail(), request.getAddress());
            profile.setAddress(request.getAddress());
        }

        // Languages (non-crucial)
        if (request.getLanguages() != null) {
            logger.info("Updating languages for NGO {} to {}", user.getEmail(), request.getLanguages());
            profile.setLanguages(request.getLanguages());
        }

        // Trigger re-approval
        if (crucialFieldChanged && user.getApprovalStatus() == ApprovalStatus.APPROVED) {
            logger.warn("Crucial NGO field changed — setting approval of {} to REAPPROVAL_PENDING", user.getEmail());
            user.setApprovalStatus(ApprovalStatus.REAPPROVAL_PENDING);
        }

        ngoProfileRepository.save(profile);
        logger.info("NGO profile updated for {}", user.getEmail());
    }
}
