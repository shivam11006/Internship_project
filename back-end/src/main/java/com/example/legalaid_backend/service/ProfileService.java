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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final LawyerProfileRepository lawyerProfileRepository;
    private final NgoProfileRepository ngoProfileRepository;

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmailWithProfiles(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserResponse getProfile() {
        User user = getCurrentUser();
        Object profile = null;

        if (user.getRole() == Role.LAWYER && user.getLawyerProfile() != null) {
            profile = user.getLawyerProfile();
        } else if (user.getRole() == Role.NGO && user.getNgoProfile() != null) {
            profile = user.getNgoProfile();
        }

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .profile(profile)
                .approvalStatus(user.getApprovalStatus())
                .enabled(user.isEnabled())
                .build();
    }


    @Transactional
    public UserResponse updateProfile(ProfileUpdateRequest request) {
        User user = getCurrentUser();

        // Update common fields (no approval needed)
        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }

        // ⭐ Update role-specific fields with crucial field detection
        if (user.getRole() == Role.LAWYER) {
            updateLawyerProfileWithApprovalCheck(user, request);
        } else if (user.getRole() == Role.NGO) {
            updateNgoProfileWithApprovalCheck(user, request);
        }

        userRepository.save(user);
        return getProfile();
    }


    private void updateLawyerProfileWithApprovalCheck(User user, ProfileUpdateRequest request) {
        LawyerProfile profile = user.getLawyerProfile();
        if (profile == null) {
            profile = new LawyerProfile();
            profile.setUser(user);
            user.setLawyerProfile(profile);
        }

        boolean crucialFieldChanged = false;

        // ⭐ CHECK CRUCIAL FIELD: Bar Number
        if (request.getBarNumber() != null &&
                !request.getBarNumber().equals(profile.getBarNumber())) {

            // Bar number changed - requires re-approval
            profile.setBarNumber(request.getBarNumber());
            crucialFieldChanged = true;
        }

        // ⭐ CHECK CRUCIAL FIELD: Specialization
        if (request.getSpecialization() != null &&
                !request.getSpecialization().equals(profile.getSpecialization())) {

            // Specialization changed - requires re-approval
            profile.setSpecialization(request.getSpecialization());
            crucialFieldChanged = true;
        }

        // ⭐ TRIGGER RE-APPROVAL if crucial field changed
        if (crucialFieldChanged && user.getApprovalStatus() == ApprovalStatus.APPROVED) {
            user.setApprovalStatus(ApprovalStatus.REAPPROVAL_PENDING);
        }

        // Update non-crucial fields (no approval needed)
        lawyerProfileRepository.save(profile);
    }

    private void updateNgoProfileWithApprovalCheck(User user, ProfileUpdateRequest request) {
        NgoProfile profile = user.getNgoProfile();
        if (profile == null) {
            profile = new NgoProfile();
            profile.setUser(user);
            user.setNgoProfile(profile);
        }

        boolean crucialFieldChanged = false;

        // ⭐ CHECK CRUCIAL FIELD: Organization Name
        if (request.getOrganizationName() != null &&
                !request.getOrganizationName().equals(profile.getOrganizationName())) {

            profile.setOrganizationName(request.getOrganizationName());
            crucialFieldChanged = true;
        }

        // ⭐ CHECK CRUCIAL FIELD: Registration Number
        if (request.getRegistrationNumber() != null &&
                !request.getRegistrationNumber().equals(profile.getRegistrationNumber())) {

            profile.setRegistrationNumber(request.getRegistrationNumber());
            crucialFieldChanged = true;
        }

        // ⭐ CHECK CRUCIAL FIELD: Focus Area
        if (request.getFocusArea() != null &&
                !request.getFocusArea().equals(profile.getFocusArea())) {

            profile.setFocusArea(request.getFocusArea());
            crucialFieldChanged = true;
        }

        // ⭐ TRIGGER RE-APPROVAL if crucial field changed
        if (crucialFieldChanged && user.getApprovalStatus() == ApprovalStatus.APPROVED) {
            user.setApprovalStatus(ApprovalStatus.REAPPROVAL_PENDING);
        }

        ngoProfileRepository.save(profile);
    }
}