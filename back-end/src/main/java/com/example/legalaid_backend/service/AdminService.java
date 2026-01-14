package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.entity.Case;
import com.example.legalaid_backend.entity.LawyerProfile;
import com.example.legalaid_backend.entity.NgoProfile;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.CaseRepository;
import com.example.legalaid_backend.repository.MatchRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.RuntimeMXBean;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final MatchRepository matchRepository;

    public List<PendingApproval> getPendingApprovals() {
        logger.info("Fetching all users with PENDING or REAPPROVAL_PENDING status");

        List<User> pendingUsers = userRepository.findByApprovalStatusIn(
                List.of(ApprovalStatus.PENDING, ApprovalStatus.REAPPROVAL_PENDING)
        );

        logger.info("Found {} users pending approval", pendingUsers.size());

        return pendingUsers.stream()
                .map(this::convertToPendingApprovalDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApprovalResponse approveUser(Long userId) {

        logger.info("Attempting to APPROVE user with ID {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("Approval failed — user ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        if (user.getApprovalStatus() != ApprovalStatus.PENDING &&
                user.getApprovalStatus() != ApprovalStatus.REAPPROVAL_PENDING) {

            logger.warn("Approval blocked — user {} is not pending approval", userId);
            throw new RuntimeException("User is not pending approval");
        }

        User admin = getCurrentAdmin();
        logger.info("Admin {} is approving user ID {}", admin.getEmail(), userId);

        // Approve user
        user.setApprovalStatus(ApprovalStatus.APPROVED);

        // Store new "last approved" values
        updateLastApprovedValues(user);

        userRepository.save(user);

        logger.info("User {} approved successfully", user.getEmail());

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    @Transactional
    public ApprovalResponse rejectUser(Long userId) {

        logger.info("Attempting to REJECT user with ID {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("Rejection failed — user ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        if (user.getApprovalStatus() != ApprovalStatus.PENDING &&
                user.getApprovalStatus() != ApprovalStatus.REAPPROVAL_PENDING) {

            logger.warn("Rejection blocked — user {} is not pending approval", userId);
            throw new RuntimeException("User is not pending approval");
        }

        User admin = getCurrentAdmin();
        logger.info("Admin {} is rejecting user {}", admin.getEmail(), user.getEmail());

        if (user.getApprovalStatus() == ApprovalStatus.PENDING) {
            user.setApprovalStatus(ApprovalStatus.REJECTED);
            logger.info("User {} registration rejected", user.getEmail());

        } else if (user.getApprovalStatus() == ApprovalStatus.REAPPROVAL_PENDING) {
            logger.info("User {} profile update rejected — reverting previous approved values", user.getEmail());

            revertToPreviousApprovedValues(user);
            user.setApprovalStatus(ApprovalStatus.APPROVED);

            logger.info("User {} reverted to last approved profile", user.getEmail());
        }

        userRepository.save(user);

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(user.getApprovalStatus())
                .build();
    }

    private void revertToPreviousApprovedValues(User user) {

        logger.info("Reverting profile for user {}", user.getEmail());

        if (user.getRole() == Role.LAWYER && user.getLawyerProfile() != null) {
            LawyerProfile profile = user.getLawyerProfile();

            logger.info("Reverting lawyer profile for {}", user.getEmail());

            if (profile.getLastApprovedBarNumber() != null)
                profile.setBarNumber(profile.getLastApprovedBarNumber());

            if (profile.getLastApprovedSpecialization() != null)
                profile.setSpecialization(profile.getLastApprovedSpecialization());
        }

        if (user.getRole() == Role.NGO && user.getNgoProfile() != null) {
            NgoProfile profile = user.getNgoProfile();

            logger.info("Reverting NGO profile for {}", user.getEmail());

            if (profile.getLastApprovedOrganizationName() != null)
                profile.setOrganizationName(profile.getLastApprovedOrganizationName());

            if (profile.getLastApprovedRegistrationNumber() != null)
                profile.setRegistrationNumber(profile.getLastApprovedRegistrationNumber());

            if (profile.getLastApprovedFocusArea() != null)
                profile.setFocusArea(profile.getLastApprovedFocusArea());
        }
    }

    @Transactional
    public ApprovalResponse suspendUser(Long userId) {

        logger.info("Attempting to SUSPEND user ID {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("Suspend failed — user ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        user.setEnabled(false);
        user.setApprovalStatus(ApprovalStatus.SUSPENDED);
        userRepository.save(user);

        logger.info("User {} suspended successfully", user.getEmail());

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(ApprovalStatus.SUSPENDED)
                .build();
    }

    @Transactional
    public ApprovalResponse reactivateUser(Long userId) {

        logger.info("Attempting to REACTIVATE user ID {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("Reactivate failed — user ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        if (user.getApprovalStatus() != ApprovalStatus.SUSPENDED) {
            logger.warn("Reactivate blocked — user {} is not suspended", user.getEmail());
            throw new RuntimeException("User is not suspended");
        }

        user.setEnabled(true);
        user.setApprovalStatus(ApprovalStatus.APPROVED);
        userRepository.save(user);

        logger.info("User {} reactivated successfully", user.getEmail());

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    private void updateLastApprovedValues(User user) {
        logger.info("Updating last approved profile fields for {}", user.getEmail());

        if (user.getRole() == Role.LAWYER && user.getLawyerProfile() != null) {
            LawyerProfile profile = user.getLawyerProfile();
            profile.setLastApprovedBarNumber(profile.getBarNumber());
            profile.setLastApprovedSpecialization(profile.getSpecialization());
        }

        if (user.getRole() == Role.NGO && user.getNgoProfile() != null) {
            NgoProfile profile = user.getNgoProfile();
            profile.setLastApprovedOrganizationName(profile.getOrganizationName());
            profile.setLastApprovedRegistrationNumber(profile.getRegistrationNumber());
            profile.setLastApprovedFocusArea(profile.getFocusArea());
        }
    }

    public Object getStatistics() {
        logger.info("Fetching admin dashboard statistics");

        return new Object() {
            public final long totalUsers = userRepository.count();
            public final long pendingApprovals = userRepository.countByApprovalStatus(ApprovalStatus.PENDING);
            public final long reapprovalPending = userRepository.countByApprovalStatus(ApprovalStatus.REAPPROVAL_PENDING);
            public final long approved = userRepository.countByApprovalStatus(ApprovalStatus.APPROVED);
            public final long rejected = userRepository.countByApprovalStatus(ApprovalStatus.REJECTED);
            public final long suspended = userRepository.countByApprovalStatus(ApprovalStatus.SUSPENDED);

            public final long citizenCount = userRepository.countByRole(Role.CITIZEN);
            public final long lawyerCount = userRepository.countByRole(Role.LAWYER);
            public final long ngoCount = userRepository.countByRole(Role.NGO);
            public final long adminCount = userRepository.countByRole(Role.ADMIN);
        };
    }

    private User getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        logger.info("Current authenticated admin: {}", email);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Admin lookup failed — {} not found in DB", email);
                    return new RuntimeException("Admin not found");
                });
    }

    private PendingApproval convertToPendingApprovalDTO(User user) {
        logger.info("Converting user {} to PendingApproval DTO", user.getEmail());

        PendingApproval dto = PendingApproval.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();

        if (user.getRole() == Role.LAWYER && user.getLawyerProfile() != null) {
            LawyerProfile profile = user.getLawyerProfile();
            dto.setBarNumber(profile.getBarNumber());
            dto.setSpecialization(profile.getSpecialization());
        } else if (user.getRole() == Role.NGO && user.getNgoProfile() != null) {
            NgoProfile profile = user.getNgoProfile();
            dto.setOrganizationName(profile.getOrganizationName());
            dto.setRegistrationNumber(profile.getRegistrationNumber());
            dto.setFocusArea(profile.getFocusArea());
        }

        return dto;
    }

    // =============================================
    // USER STATUS MANAGEMENT
    // =============================================

    /**
     * Update user status (enable/disable and approval status)
     */
    @Transactional
    public ApprovalResponse updateUserStatus(Long userId, UserStatusUpdateRequest request) {
        logger.info("Attempting to update status for user ID {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("User not found with ID {}", userId);
                    return new RuntimeException("User not found");
                });

        User admin = getCurrentAdmin();
        logger.info("Admin {} is updating status for user {}", admin.getEmail(), user.getEmail());

        // Update enabled status if provided
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
            logger.info("User {} enabled status set to {}", user.getEmail(), request.getEnabled());
        }

        // Update approval status if provided
        if (request.getApprovalStatus() != null) {
            try {
                ApprovalStatus newStatus = ApprovalStatus.valueOf(request.getApprovalStatus().toUpperCase());
                user.setApprovalStatus(newStatus);
                logger.info("User {} approval status set to {}", user.getEmail(), newStatus);
            } catch (IllegalArgumentException e) {
                logger.error("Invalid approval status: {}", request.getApprovalStatus());
                throw new RuntimeException("Invalid approval status: " + request.getApprovalStatus());
            }
        }

        userRepository.save(user);
        logger.info("User {} status updated successfully", user.getEmail());

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(user.getApprovalStatus())
                .build();
    }

    // =============================================
    // VERIFICATION MANAGEMENT
    // =============================================

    /**
     * Get all pending verifications for lawyers and NGOs
     */
    public List<VerificationResponse> getPendingVerifications() {
        logger.info("Fetching all pending verifications for lawyers and NGOs");

        List<User> pendingUsers = userRepository.findByApprovalStatusIn(
                List.of(ApprovalStatus.PENDING, ApprovalStatus.REAPPROVAL_PENDING)
        );

        // Filter only lawyers and NGOs
        List<VerificationResponse> verifications = pendingUsers.stream()
                .filter(u -> u.getRole() == Role.LAWYER || u.getRole() == Role.NGO)
                .map(this::convertToVerificationResponse)
                .collect(Collectors.toList());

        logger.info("Found {} pending verifications", verifications.size());
        return verifications;
    }

    /**
     * Verify a lawyer
     */
    @Transactional
    public ApprovalResponse verifyLawyer(Long userId) {
        logger.info("Attempting to verify lawyer with ID {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("User not found with ID {}", userId);
                    return new RuntimeException("User not found");
                });

        if (user.getRole() != Role.LAWYER) {
            logger.error("User {} is not a lawyer", user.getEmail());
            throw new RuntimeException("User is not a lawyer");
        }

        if (user.getApprovalStatus() != ApprovalStatus.PENDING &&
                user.getApprovalStatus() != ApprovalStatus.REAPPROVAL_PENDING) {
            logger.warn("Lawyer {} is not pending verification", user.getEmail());
            throw new RuntimeException("Lawyer is not pending verification");
        }

        User admin = getCurrentAdmin();
        logger.info("Admin {} is verifying lawyer {}", admin.getEmail(), user.getEmail());

        user.setApprovalStatus(ApprovalStatus.APPROVED);
        updateLastApprovedValues(user);
        userRepository.save(user);

        logger.info("Lawyer {} verified successfully", user.getEmail());

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    /**
     * Verify an NGO
     */
    @Transactional
    public ApprovalResponse verifyNgo(Long userId) {
        logger.info("Attempting to verify NGO with ID {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("User not found with ID {}", userId);
                    return new RuntimeException("User not found");
                });

        if (user.getRole() != Role.NGO) {
            logger.error("User {} is not an NGO", user.getEmail());
            throw new RuntimeException("User is not an NGO");
        }

        if (user.getApprovalStatus() != ApprovalStatus.PENDING &&
                user.getApprovalStatus() != ApprovalStatus.REAPPROVAL_PENDING) {
            logger.warn("NGO {} is not pending verification", user.getEmail());
            throw new RuntimeException("NGO is not pending verification");
        }

        User admin = getCurrentAdmin();
        logger.info("Admin {} is verifying NGO {}", admin.getEmail(), user.getEmail());

        user.setApprovalStatus(ApprovalStatus.APPROVED);
        updateLastApprovedValues(user);
        userRepository.save(user);

        logger.info("NGO {} verified successfully", user.getEmail());

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    // =============================================
    // CASE MANAGEMENT (ADMIN VIEW)
    // =============================================

    /**
     * Get all cases with pagination and sorting (Admin view)
     */
    public Page<AdminCaseResponse> getAllCases(int page, int size, String sortBy, String sortOrder) {
        logger.info("Fetching all cases - page: {}, size: {}, sortBy: {}, sortOrder: {}", 
                page, size, sortBy, sortOrder);

        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );

        PageRequest pageRequest = PageRequest.of(page, size, sort);
        Page<Case> cases = caseRepository.findAll(pageRequest);

        logger.info("Found {} cases", cases.getTotalElements());
        return cases.map(this::convertToAdminCaseResponse);
    }

    /**
     * Get all cases without pagination (for smaller datasets)
     */
    public List<AdminCaseResponse> getAllCasesList() {
        logger.info("Fetching all cases (no pagination)");

        List<Case> cases = caseRepository.findAll();
        logger.info("Found {} cases", cases.size());

        return cases.stream()
                .map(this::convertToAdminCaseResponse)
                .collect(Collectors.toList());
    }

    // =============================================
    // SYSTEM HEALTH
    // =============================================

    /**
     * Get system health status
     */
    public SystemHealthResponse getSystemHealth() {
        logger.info("Checking system health");

        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        Runtime runtime = Runtime.getRuntime();

        // Memory metrics
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;

        // CPU metrics
        int availableProcessors = runtime.availableProcessors();
        com.sun.management.OperatingSystemMXBean osBean = 
                (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        double cpuUsage = osBean.getCpuLoad() * 100;

        // Build component health checks
        Map<String, SystemHealthResponse.ComponentHealth> components = new HashMap<>();

        // Database health check
        try {
            long userCount = userRepository.count();
            components.put("database", SystemHealthResponse.ComponentHealth.builder()
                    .status("UP")
                    .details("Connected - " + userCount + " users")
                    .build());
        } catch (Exception e) {
            logger.error("Database health check failed", e);
            components.put("database", SystemHealthResponse.ComponentHealth.builder()
                    .status("DOWN")
                    .details(e.getMessage())
                    .build());
        }

        // Memory health check
        double memoryUsagePercent = ((double) usedMemory / totalMemory) * 100;
        String memoryStatus = memoryUsagePercent > 90 ? "DEGRADED" : "UP";
        components.put("memory", SystemHealthResponse.ComponentHealth.builder()
                .status(memoryStatus)
                .details(String.format("%.1f%% used", memoryUsagePercent))
                .build());

        // Determine overall status
        String overallStatus = "UP";
        for (SystemHealthResponse.ComponentHealth component : components.values()) {
            if ("DOWN".equals(component.getStatus())) {
                overallStatus = "DOWN";
                break;
            } else if ("DEGRADED".equals(component.getStatus())) {
                overallStatus = "DEGRADED";
            }
        }

        SystemHealthResponse.SystemMetrics metrics = SystemHealthResponse.SystemMetrics.builder()
                .totalMemory(totalMemory)
                .freeMemory(freeMemory)
                .usedMemory(usedMemory)
                .availableProcessors(availableProcessors)
                .uptime(runtimeMXBean.getUptime())
                .cpuUsage(cpuUsage)
                .build();

        logger.info("System health check complete - Status: {}", overallStatus);

        return SystemHealthResponse.builder()
                .status(overallStatus)
                .timestamp(LocalDateTime.now())
                .components(components)
                .metrics(metrics)
                .build();
    }

    // =============================================
    // CONVERSION HELPERS
    // =============================================

    private VerificationResponse convertToVerificationResponse(User user) {
        VerificationResponse.VerificationResponseBuilder builder = VerificationResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .approvalStatus(user.getApprovalStatus())
                .createdAt(user.getCreatedAt())
                .enabled(user.isEnabled())
                .location(user.getLocation());

        if (user.getRole() == Role.LAWYER && user.getLawyerProfile() != null) {
            LawyerProfile profile = user.getLawyerProfile();
            builder.barNumber(profile.getBarNumber())
                    .specialization(profile.getSpecialization())
                    .address(profile.getAddress())
                    .languages(profile.getLanguages());
        } else if (user.getRole() == Role.NGO && user.getNgoProfile() != null) {
            NgoProfile profile = user.getNgoProfile();
            builder.organizationName(profile.getOrganizationName())
                    .registrationNumber(profile.getRegistrationNumber())
                    .focusArea(profile.getFocusArea())
                    .address(profile.getAddress())
                    .languages(profile.getLanguages());
        }

        return builder.build();
    }

    private AdminCaseResponse convertToAdminCaseResponse(Case legalCase) {
        int matchCount = 0;
        try {
            matchCount = matchRepository.findByLegalCaseId(legalCase.getId()).size();
        } catch (Exception e) {
            logger.warn("Could not fetch match count for case {}", legalCase.getId());
        }

        return AdminCaseResponse.builder()
                .id(legalCase.getId())
                .caseNumber(legalCase.getCaseNumber())
                .title(legalCase.getTitle())
                .description(legalCase.getDescription())
                .caseType(legalCase.getCaseType())
                .priority(legalCase.getPriority())
                .status(legalCase.getStatus())
                .location(legalCase.getLocation())
                .preferredLanguage(legalCase.getPreferredLanguage())
                .expertiseTags(legalCase.getExpertiseTags())
                .createdById(legalCase.getCreatedBy().getId())
                .createdByUsername(legalCase.getCreatedBy().getUsername())
                .createdByEmail(legalCase.getCreatedBy().getEmail())
                .createdAt(legalCase.getCreatedAt())
                .updatedAt(legalCase.getUpdatedAt())
                .attachmentCount(legalCase.getAttachments() != null ? legalCase.getAttachments().size() : 0)
                .matchCount(matchCount)
                .build();
    }
}
