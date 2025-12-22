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
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    /**
     * SEARCH LAWYERS
     * GET /api/users/lawyers
     */
    @GetMapping("/lawyers")
    public ResponseEntity<List<UserResponse>> getApprovedLawyers(
            @RequestParam(required = false) String specialization,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/users/lawyers");

        try {
            log.info("User {} requested approved lawyers, filter: specialization={}",
                    auth.getName(),
                    specialization);

            // Get only APPROVED lawyers
            List<User> lawyers = userRepository.findByRoleAndApprovalStatus(
                    Role.LAWYER,
                    ApprovalStatus.APPROVED
            );

            log.debug("Found {} approved lawyers before filtering", lawyers.size());

            // Filter by specialization if needed
            if (specialization != null && !specialization.isEmpty()) {
                lawyers = lawyers.stream()
                        .filter(user -> user.getLawyerProfile() != null &&
                                user.getLawyerProfile().getSpecialization() != null &&
                                user.getLawyerProfile().getSpecialization()
                                        .toLowerCase().contains(specialization.toLowerCase()))
                        .collect(Collectors.toList());
                log.info("{} lawyers match specialization '{}'", lawyers.size(), specialization);
            }

            List<UserResponse> response = lawyers.stream()
                    .map(lawyer -> convertToPublicResponse(lawyer, lawyer.getLawyerProfile()))
                    .collect(Collectors.toList());

            log.info("Returning {} lawyer profiles to user {}", response.size(), auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to fetch lawyers for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * SEARCH NGOs
     * GET /api/users/ngos
     */
    @GetMapping("/ngos")
    public ResponseEntity<List<UserResponse>> getApprovedNgos(
            @RequestParam(required = false) String focusArea,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/users/ngos");

        try {
            log.info("User {} requested approved NGOs, filter: focusArea={}",
                    auth.getName(),
                    focusArea);

            List<User> ngos = userRepository.findByRoleAndApprovalStatus(
                    Role.NGO,
                    ApprovalStatus.APPROVED
            );

            log.debug("Found {} approved NGOs before filtering", ngos.size());

            if (focusArea != null && !focusArea.isEmpty()) {
                ngos = ngos.stream()
                        .filter(user -> user.getNgoProfile() != null &&
                                user.getNgoProfile().getFocusArea() != null &&
                                user.getNgoProfile().getFocusArea()
                                        .toLowerCase().contains(focusArea.toLowerCase()))
                        .collect(Collectors.toList());
                log.info("{} NGOs match focus area '{}'", ngos.size(), focusArea);
            }

            List<UserResponse> response = ngos.stream()
                    .map(ngo -> convertToPublicResponse(ngo, ngo.getNgoProfile()))
                    .collect(Collectors.toList());

            log.info("Returning {} NGO profiles to user {}", response.size(), auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to fetch NGOs for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * VIEW PUBLIC PROFILE
     * GET /api/users/{id}/public
     */
    @GetMapping("/{id}/public")
    public ResponseEntity<?> getPublicProfile(
            @PathVariable Long id,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/users/" + id + "/public");

        try {
            log.info("User {} requested public profile for user ID {}", auth.getName(), id);

            User user = userRepository.findById(id)
                    .orElseThrow(() -> {
                        log.warn("Public profile request failed - user ID {} not found", id);
                        return new RuntimeException("User not found");
                    });

            // Only show approved professionals
            if (user.getApprovalStatus() != ApprovalStatus.APPROVED) {
                log.warn("Public profile request denied – user {} not approved (status: {})",
                        id, user.getApprovalStatus());
                return ResponseEntity.notFound().build();
            }

            // Only lawyers and NGOs have public profiles
            if (user.getRole() != Role.LAWYER && user.getRole() != Role.NGO) {
                log.warn("Public profile request denied – user {} is {} (not lawyer/NGO)",
                        id, user.getRole());
                return ResponseEntity.notFound().build();
            }

            Object profile = (user.getRole() == Role.LAWYER)
                    ? user.getLawyerProfile()
                    : user.getNgoProfile();

            UserResponse response = convertToPublicResponse(user, profile);

            log.info("Public profile returned for user ID {} to requester {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching public profile for user {} requested by {}: {}",
                    id, auth.getName(), e.getMessage(), e);
            return ResponseEntity.notFound().build();
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET PUBLIC STATISTICS
     * GET /api/users/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPublicStats(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/users/stats");

        try {
            log.info("User {} requested public statistics", auth.getName());

            Map<String, Object> stats = new HashMap<>();

            stats.put("approvedLawyers", userRepository.countByRoleAndApprovalStatus(
                    Role.LAWYER, ApprovalStatus.APPROVED));
            stats.put("approvedNgos", userRepository.countByRoleAndApprovalStatus(
                    Role.NGO, ApprovalStatus.APPROVED));
            stats.put("totalCitizens", userRepository.countByRole(Role.CITIZEN));

            log.debug("Public statistics: {}", stats);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Failed to fetch statistics for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    // Helper method to convert to public profile
    private UserResponse convertToPublicResponse(User user, Object profile) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .profile(profile)
                .approvalStatus(user.getApprovalStatus())
                .build();
    }
}
