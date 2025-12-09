package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.ProfileUpdateRequest;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")  // ⭐ All endpoints require authentication
public class ProfileController {

    private final ProfileService profileService;

    /**
     * GET CURRENT USER'S PROFILE
     * GET /api/profile/me
     * Returns the profile of the currently logged-in user
     * Includes approval status and role-specific information
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile() {
        UserResponse profile = profileService.getProfile();
        return ResponseEntity.ok(profile);
    }

    /**
     * UPDATE CURRENT USER'S PROFILE
     * PUT /api/profile/update
     * Updates the currently logged-in user's profile
     * KEY FEATURES:
     * - Automatically detects if crucial fields changed
     * - Triggers re-approval if needed (for Lawyers/NGOs)
     * - Non-crucial fields update without admin approval
     * Examples:
     * Lawyer updates bio → Updates immediately ✅
     * Lawyer updates barNumber → Triggers re-approval ⏳
     */
    @PutMapping("/update")
    public ResponseEntity<?> updateMyProfile(@RequestBody ProfileUpdateRequest request) {
        try {
            UserResponse updatedProfile = profileService.updateProfile(request);

            // Check if update triggered re-approval
            if (updatedProfile.getApprovalStatus().name().equals("REAPPROVAL_PENDING")) {
                Map<String, Object> response = new HashMap<>();
                response.put("profile", updatedProfile);
                response.put("message", "Profile updated. Crucial field changes are pending admin approval.");
                response.put("requiresApproval", true);
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.ok(updatedProfile);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

}