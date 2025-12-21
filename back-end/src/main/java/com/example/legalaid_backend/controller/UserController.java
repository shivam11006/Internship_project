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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final UserRepository userRepository;

    /**
     * SEARCH LAWYERS
     * GET /api/users/lawyers
     */
    @GetMapping("/lawyers")
    public ResponseEntity<List<UserResponse>> getApprovedLawyers(
            @RequestParam(required = false) String specialization) {

        logger.info("Request received: Fetching approved lawyers. Filter specialization = {}", specialization);

        // Get only APPROVED lawyers
        List<User> lawyers = userRepository.findByRoleAndApprovalStatus(
                Role.LAWYER,
                ApprovalStatus.APPROVED
        );

        logger.info("Found {} approved lawyers before filtering", lawyers.size());

        // Filter by specialization if needed
        if (specialization != null && !specialization.isEmpty()) {
            lawyers = lawyers.stream()
                    .filter(user -> user.getLawyerProfile() != null &&
                            user.getLawyerProfile().getSpecialization() != null &&
                            user.getLawyerProfile().getSpecialization()
                                    .toLowerCase().contains(specialization.toLowerCase()))
                    .collect(Collectors.toList());
            logger.info("{} lawyers match specialization '{}'", lawyers.size(), specialization);
        }

        List<UserResponse> response = lawyers.stream()
                .map(lawyer -> convertToPublicResponse(lawyer, lawyer.getLawyerProfile()))
                .collect(Collectors.toList());

        logger.info("Returning {} lawyer profiles", response.size());

        return ResponseEntity.ok(response);
    }

    /**
     * SEARCH NGOs
     * GET /api/users/ngos
     */
    @GetMapping("/ngos")
    public ResponseEntity<List<UserResponse>> getApprovedNgos(
            @RequestParam(required = false) String focusArea) {

        logger.info("Request received: Fetching approved NGOs. Filter focusArea = {}", focusArea);

        List<User> ngos = userRepository.findByRoleAndApprovalStatus(
                Role.NGO,
                ApprovalStatus.APPROVED
        );

        logger.info("Found {} approved NGOs before filtering", ngos.size());

        if (focusArea != null && !focusArea.isEmpty()) {
            ngos = ngos.stream()
                    .filter(user -> user.getNgoProfile() != null &&
                            user.getNgoProfile().getFocusArea() != null &&
                            user.getNgoProfile().getFocusArea()
                                    .toLowerCase().contains(focusArea.toLowerCase()))
                    .collect(Collectors.toList());
            logger.info("{} NGOs match focus area '{}'", ngos.size(), focusArea);
        }

        List<UserResponse> response = ngos.stream()
                .map(ngo -> convertToPublicResponse(ngo, ngo.getNgoProfile()))
                .collect(Collectors.toList());

        logger.info("Returning {} NGO profiles", response.size());

        return ResponseEntity.ok(response);
    }

    /**
     * VIEW PUBLIC PROFILE
     * GET /api/users/{id}/public
     */
    @GetMapping("/{id}/public")
    public ResponseEntity<?> getPublicProfile(@PathVariable Long id) {

        logger.info("Request received: Fetching public profile for user ID {}", id);

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.error("User not found: ID {}", id);
                        return new RuntimeException("User not found");
                    });

            // Only show approved professionals
            if (user.getApprovalStatus() != ApprovalStatus.APPROVED) {
                logger.warn("Public profile request denied — user {} not approved", id);
                return ResponseEntity.notFound().build();
            }

            // Only lawyers and NGOs have public profiles
            if (user.getRole() != Role.LAWYER && user.getRole() != Role.NGO) {
                logger.warn("Public profile request denied — user {} is not lawyer/NGO", id);
                return ResponseEntity.notFound().build();
            }

            Object profile = (user.getRole() == Role.LAWYER)
                    ? user.getLawyerProfile()
                    : user.getNgoProfile();

            UserResponse response = convertToPublicResponse(user, profile);

            logger.info("Returning public profile for user ID {}", id);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error fetching public profile for user {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET PUBLIC STATISTICS
     * GET /api/users/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPublicStats() {

        logger.info("Request received: Fetching public statistics");

        Map<String, Object> stats = new HashMap<>();

        stats.put("approvedLawyers", userRepository.countByRoleAndApprovalStatus(
                Role.LAWYER, ApprovalStatus.APPROVED));
        stats.put("approvedNgos", userRepository.countByRoleAndApprovalStatus(
                Role.NGO, ApprovalStatus.APPROVED));
        stats.put("totalCitizens", userRepository.countByRole(Role.CITIZEN));

        logger.info("Statistics fetched: {}", stats);

        return ResponseEntity.ok(stats);
    }

    // Helper method to convert to public profile
    private UserResponse convertToPublicResponse(User user, Object profile) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())   // optional to hide
                .role(user.getRole())
                .profile(profile)
                .approvalStatus(user.getApprovalStatus())
                .build();
    }
}
