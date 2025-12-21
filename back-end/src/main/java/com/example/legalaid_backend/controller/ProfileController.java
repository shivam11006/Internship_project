package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.ProfileUpdateRequest;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);

    private final ProfileService profileService;

    /**
     * GET CURRENT USER'S PROFILE
     * GET /api/profile/me
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile() {

        logger.info("Request received: Fetching current user's profile");

        UserResponse profile = profileService.getProfile();

        logger.info("Profile fetched successfully for user: {}", profile.getEmail());

        return ResponseEntity.ok(profile);
    }

    /**
     * UPDATE CURRENT USER'S PROFILE
     * PUT /api/profile/update
     */
    @PutMapping("/update")
    public ResponseEntity<?> updateMyProfile(@RequestBody ProfileUpdateRequest request) {

        logger.info("Profile update request received");

        try {
            UserResponse updatedProfile = profileService.updateProfile(request);

            logger.info("Profile updated for user: {}", updatedProfile.getEmail());

            // If re-approval required
            if (updatedProfile.getApprovalStatus().name().equals("REAPPROVAL_PENDING")) {

                logger.info("Profile update triggered REAPPROVAL_PENDING for user: {}", updatedProfile.getEmail());

                Map<String, Object> response = new HashMap<>();
                response.put("profile", updatedProfile);
                response.put("message", "Profile updated. Crucial fields changed — admin approval required.");
                response.put("requiresApproval", true);

                return ResponseEntity.ok(response);
            }

            return ResponseEntity.ok(updatedProfile);

        } catch (Exception e) {
            logger.error("Error updating profile: {}", e.getMessage());

            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            return ResponseEntity.badRequest().body(error);
        }
    }

}
