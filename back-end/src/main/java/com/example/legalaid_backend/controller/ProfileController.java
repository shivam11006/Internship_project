package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.ProfileUpdateRequest;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService profileService;

    /**
     * GET CURRENT USER'S PROFILE
     * GET /api/profile/me
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/profile/me");

        try {
            log.info("User {} requested their profile", auth.getName());

            UserResponse profile = profileService.getProfile();

            log.debug("Profile retrieved successfully for user: {}, role: {}",
                    profile.getEmail(),
                    profile.getRole());

            return ResponseEntity.ok(profile);

        } catch (Exception e) {
            log.error("Failed to retrieve profile for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * UPDATE CURRENT USER'S PROFILE
     * PUT /api/profile/update
     */
    @PutMapping("/update")
    public ResponseEntity<?> updateMyProfile(
            @RequestBody ProfileUpdateRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/profile/update");

        try {
            log.info("Profile update request received from user: {}", auth.getName());
            log.debug("Update request details: username={}, profile fields present={}",
                    request.getUsername(),
                    (request.getBarNumber() != null || request.getRegistrationNumber() != null));

            UserResponse updatedProfile = profileService.updateProfile(request);

            // Check if re-approval is required
            if ("REAPPROVAL_PENDING".equals(updatedProfile.getApprovalStatus().name())) {
                log.warn("Profile update triggered REAPPROVAL_PENDING for user: {} - crucial fields changed",
                        updatedProfile.getEmail());

                Map<String, Object> response = new HashMap<>();
                response.put("profile", updatedProfile);
                response.put("message", "Profile updated. Crucial fields changed – admin approval required.");
                response.put("requiresApproval", true);

                return ResponseEntity.ok(response);
            }

            log.info("Profile updated successfully for user: {}, status: {}",
                    updatedProfile.getEmail(),
                    updatedProfile.getApprovalStatus());

            return ResponseEntity.ok(updatedProfile);

        } catch (Exception e) {
            log.error("Failed to update profile for user {}: {}", auth.getName(), e.getMessage(), e);

            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

}
