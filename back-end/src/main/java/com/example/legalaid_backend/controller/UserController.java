package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.RegisterRequest;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.service.UserService;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    /**
     SEARCH LAWYERS
     * GET /api/users/lawyers
     * Returns all APPROVED lawyers
     * Citizens use this to find legal help
     */
    @GetMapping("/lawyers")
    public ResponseEntity<List<UserResponse>> getApprovedLawyers(
            @RequestParam(required = false) String specialization) {

        // Get only APPROVED lawyers
        List<User> lawyers = userRepository.findByRoleAndApprovalStatus(
                Role.LAWYER,
                ApprovalStatus.APPROVED
        );

        // Filter by specialization if provided
        if (specialization != null && !specialization.isEmpty()) {
            lawyers = lawyers.stream()
                    .filter(user -> user.getLawyerProfile() != null &&
                            user.getLawyerProfile().getSpecialization() != null &&
                            user.getLawyerProfile().getSpecialization()
                                    .toLowerCase().contains(specialization.toLowerCase()))
                    .collect(Collectors.toList());
        }

        List<UserResponse> response = lawyers.stream()
                .map(lawyer -> {
                    Object profile = lawyer.getLawyerProfile();
                    return convertToPublicResponse(lawyer, profile);
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * SEARCH NGOs
     * GET /api/users/ngos
     * Returns all APPROVED NGOs
     * Citizens use this to find legal aid organizations
     */
    @GetMapping("/ngos")
    public ResponseEntity<List<UserResponse>> getApprovedNgos(
            @RequestParam(required = false) String focusArea) {

        // Get only APPROVED NGOs
        List<User> ngos = userRepository.findByRoleAndApprovalStatus(
                Role.NGO,
                ApprovalStatus.APPROVED
        );

        // Filter by focus area if provided
        if (focusArea != null && !focusArea.isEmpty()) {
            ngos = ngos.stream()
                    .filter(user -> user.getNgoProfile() != null &&
                            user.getNgoProfile().getFocusArea() != null &&
                            user.getNgoProfile().getFocusArea()
                                    .toLowerCase().contains(focusArea.toLowerCase()))
                    .collect(Collectors.toList());
        }

        List<UserResponse> response = ngos.stream()
                .map(ngo -> {
                    Object profile = ngo.getNgoProfile();
                    return convertToPublicResponse(ngo, profile);
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * VIEW PUBLIC PROFILE
     * GET /api/users/{id}/public
     * Returns public information about a lawyer/NGO
     *  IMPORTANT:
     * - Only shows APPROVED users
     * - Does NOT expose sensitive information
     * - Suitable for public viewing
     */
    @GetMapping("/{id}/public")
    public ResponseEntity<?> getPublicProfile(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Only show approved professionals
            if (user.getApprovalStatus() != ApprovalStatus.APPROVED) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Profile not available");
                return ResponseEntity.notFound().build();
            }

            // Only show lawyers and NGOs publicly
            if (user.getRole() != Role.LAWYER && user.getRole() != Role.NGO) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Profile not available");
                return ResponseEntity.notFound().build();
            }

            Object profile = null;
            if (user.getRole() == Role.LAWYER) {
                profile = user.getLawyerProfile();
            } else if (user.getRole() == Role.NGO) {
                profile = user.getNgoProfile();
            }

            UserResponse response = convertToPublicResponse(user, profile);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not found");
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET STATISTICS (Public)
     * GET /api/users/stats
     * Returns public statistics
     * Useful for landing page
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPublicStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("approvedLawyers", userRepository.countByRoleAndApprovalStatus(
                Role.LAWYER, ApprovalStatus.APPROVED
        ));

        stats.put("approvedNgos", userRepository.countByRoleAndApprovalStatus(
                Role.NGO, ApprovalStatus.APPROVED
        ));

        stats.put("totalCitizens", userRepository.countByRole(Role.CITIZEN));

        return ResponseEntity.ok(stats);
    }

    // Helper method - convert to public response (hides sensitive info)
    private UserResponse convertToPublicResponse(User user, Object profile) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())  // Consider hiding or masking this
                .role(user.getRole())
                .profile(profile)
                .approvalStatus(user.getApprovalStatus())
                .build();
    }
}