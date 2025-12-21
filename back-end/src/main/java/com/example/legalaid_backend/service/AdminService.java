package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.ApprovalRequest;
import com.example.legalaid_backend.DTO.ApprovalResponse;
import com.example.legalaid_backend.DTO.PendingApproval;
import com.example.legalaid_backend.entity.LawyerProfile;
import com.example.legalaid_backend.entity.NgoProfile;
import com.example.legalaid_backend.entity.User;
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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;

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
}
