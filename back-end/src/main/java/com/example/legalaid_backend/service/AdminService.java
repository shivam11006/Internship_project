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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    public List<PendingApproval> getPendingApprovals() {
        List<User> pendingUsers = userRepository.findByApprovalStatusIn(
                List.of(ApprovalStatus.PENDING, ApprovalStatus.REAPPROVAL_PENDING)
        );

        return pendingUsers.stream()
                .map(this::convertToPendingApprovalDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApprovalResponse approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getApprovalStatus() != ApprovalStatus.PENDING &&
                user.getApprovalStatus() != ApprovalStatus.REAPPROVAL_PENDING) {
            throw new RuntimeException("User is not pending approval");
        }

        User admin = getCurrentAdmin();

        // Approve
        user.setApprovalStatus(ApprovalStatus.APPROVED);

        // Update "last approved" values
        updateLastApprovedValues(user);

        userRepository.save(user);

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    /**
     * REJECT USER
     * Reject with optional reason
     */
    @Transactional
    public ApprovalResponse rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getApprovalStatus() != ApprovalStatus.PENDING &&
                user.getApprovalStatus() != ApprovalStatus.REAPPROVAL_PENDING) {
            throw new RuntimeException("User is not pending approval");
        }

        User admin = getCurrentAdmin();

        if (user.getApprovalStatus() == ApprovalStatus.PENDING) {
            // New user registration rejected
            user.setApprovalStatus(ApprovalStatus.REJECTED);

        } else if (user.getApprovalStatus() == ApprovalStatus.REAPPROVAL_PENDING) {
            // Profile update rejected - revert to previous values
            revertToPreviousApprovedValues(user);
            user.setApprovalStatus(ApprovalStatus.APPROVED);
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
        if (user.getRole() == Role.LAWYER && user.getLawyerProfile() != null) {
            LawyerProfile profile = user.getLawyerProfile();

            // Revert to last approved values
            if (profile.getLastApprovedBarNumber() != null) {
                profile.setBarNumber(profile.getLastApprovedBarNumber());
            }
            if (profile.getLastApprovedSpecialization() != null) {
                profile.setSpecialization(profile.getLastApprovedSpecialization());
            }
        }

        if (user.getRole() == Role.NGO && user.getNgoProfile() != null) {
            NgoProfile profile = user.getNgoProfile();

            // Revert to last approved values
            if (profile.getLastApprovedOrganizationName() != null) {
                profile.setOrganizationName(profile.getLastApprovedOrganizationName());
            }
            if (profile.getLastApprovedRegistrationNumber() != null) {
                profile.setRegistrationNumber(profile.getLastApprovedRegistrationNumber());
            }
            if (profile.getLastApprovedFocusArea() != null) {
                profile.setFocusArea(profile.getLastApprovedFocusArea());
            }
        }
    }

    @Transactional
    public ApprovalResponse suspendUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEnabled(false);
        user.setApprovalStatus(ApprovalStatus.SUSPENDED);

        userRepository.save(user);

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(ApprovalStatus.SUSPENDED)
                .build();
    }

    @Transactional
    public ApprovalResponse reactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getApprovalStatus() != ApprovalStatus.SUSPENDED) {
            throw new RuntimeException("User is not suspended");
        }

        user.setEnabled(true);
        user.setApprovalStatus(ApprovalStatus.APPROVED);

        userRepository.save(user);

        return ApprovalResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    private void updateLastApprovedValues(User user) {
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
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
    }

    private PendingApproval convertToPendingApprovalDTO(User user) {
        PendingApproval dto = PendingApproval.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();

        // Add role-specific information
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
