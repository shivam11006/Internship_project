package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.DirectorySearchRequest;
import com.example.legalaid_backend.DTO.LawyerDirectoryResponse;
import com.example.legalaid_backend.DTO.NgoDirectoryResponse;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DirectoryService {
    private final UserRepository userRepository;

    /**
     * Search lawyers with filters and pagination
     */
    public Page<LawyerDirectoryResponse> searchLawyers(DirectorySearchRequest request) {
        // Fetch all approved and enabled lawyers
        List<User> allLawyers = userRepository.findByRoleAndApprovalStatusAndEnabled(
                Role.LAWYER,
                ApprovalStatus.APPROVED,
                true
        );

        // Apply filters
        List<LawyerDirectoryResponse> filtered = allLawyers.stream()
                .filter(user -> user.getLawyerProfile() != null)
                // Filter by expertise (specialization)
                .filter(user -> request.getExpertise() == null ||
                        request.getExpertise().isBlank() ||
                        user.getLawyerProfile().getSpecialization()
                                .toLowerCase()
                                .contains(request.getExpertise().toLowerCase()))
                // Filter by keyword (searches username, email, barNumber)
                .filter(user -> request.getKeyword() == null ||
                        request.getKeyword().isBlank() ||
                        matchesKeyword(user, request.getKeyword()))
                // Convert to DTO
                .map(this::convertToLawyerResponse)
                .collect(Collectors.toList());

        // Apply sorting
        filtered = applySorting(filtered, request.getSortBy(), request.getSortOrder());

        // Apply pagination
        return paginateLawyers(filtered, request.getPage(), request.getSize());
    }

    /**
     * Search NGOs with filters and pagination
     */
    public Page<NgoDirectoryResponse> searchNgos(DirectorySearchRequest request) {
        // Fetch all approved and enabled NGOs
        List<User> allNgos = userRepository.findByRoleAndApprovalStatusAndEnabled(
                Role.NGO,
                ApprovalStatus.APPROVED,
                true
        );

        // Apply filters
        List<NgoDirectoryResponse> filtered = allNgos.stream()
                .filter(user -> user.getNgoProfile() != null)
                // Filter by expertise (focusArea)
                .filter(user -> request.getExpertise() == null ||
                        request.getExpertise().isBlank() ||
                        user.getNgoProfile().getFocusArea()
                                .toLowerCase()
                                .contains(request.getExpertise().toLowerCase()))
                // Filter by keyword (searches username, email, organization name)
                .filter(user -> request.getKeyword() == null ||
                        request.getKeyword().isBlank() ||
                        matchesNgoKeyword(user, request.getKeyword()))
                // Convert to DTO
                .map(this::convertToNgoResponse)
                .collect(Collectors.toList());

        // Apply sorting
        filtered = applySortingForNgos(filtered, request.getSortBy(), request.getSortOrder());

        // Apply pagination
        return paginateNgos(filtered, request.getPage(), request.getSize());
    }

    /**
     * Get lawyer by user ID (only if approved and enabled)
     */
    public LawyerDirectoryResponse getLawyerById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Lawyer not found"));

        if (user.getRole() != Role.LAWYER ||
                user.getApprovalStatus() != ApprovalStatus.APPROVED ||
                !user.isEnabled()) {
            throw new RuntimeException("Lawyer not available");
        }

        if (user.getLawyerProfile() == null) {
            throw new RuntimeException("Lawyer profile not found");
        }

        return convertToLawyerResponse(user);
    }

    /**
     * Get NGO by user ID (only if approved and enabled)
     */
    public NgoDirectoryResponse getNgoById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("NGO not found"));

        if (user.getRole() != Role.NGO ||
                user.getApprovalStatus() != ApprovalStatus.APPROVED ||
                !user.isEnabled()) {
            throw new RuntimeException("NGO not available");
        }

        if (user.getNgoProfile() == null) {
            throw new RuntimeException("NGO profile not found");
        }

        return convertToNgoResponse(user);
    }

    // ==================== HELPER METHODS ====================

    private boolean matchesKeyword(User user, String keyword) {
        String lowerKeyword = keyword.toLowerCase();
        return user.getUsername().toLowerCase().contains(lowerKeyword) ||
                user.getEmail().toLowerCase().contains(lowerKeyword) ||
                (user.getLawyerProfile() != null &&
                        user.getLawyerProfile().getBarNumber().toLowerCase().contains(lowerKeyword));
    }

    private boolean matchesNgoKeyword(User user, String keyword) {
        String lowerKeyword = keyword.toLowerCase();
        return user.getUsername().toLowerCase().contains(lowerKeyword) ||
                user.getEmail().toLowerCase().contains(lowerKeyword) ||
                (user.getNgoProfile() != null &&
                        user.getNgoProfile().getOrganizationName().toLowerCase().contains(lowerKeyword));
    }

    private List<LawyerDirectoryResponse> applySorting(
            List<LawyerDirectoryResponse> lawyers,
            String sortBy,
            String sortOrder) {

        Comparator<LawyerDirectoryResponse> comparator;

        switch (sortBy.toLowerCase()) {
            case "specialization":
                comparator = Comparator.comparing(LawyerDirectoryResponse::getSpecialization);
                break;
            case "email":
                comparator = Comparator.comparing(LawyerDirectoryResponse::getEmail);
                break;
            case "username":
            default:
                comparator = Comparator.comparing(LawyerDirectoryResponse::getUsername);
                break;
        }

        if ("desc".equalsIgnoreCase(sortOrder)) {
            comparator = comparator.reversed();
        }

        return lawyers.stream().sorted(comparator).collect(Collectors.toList());
    }

    private List<NgoDirectoryResponse> applySortingForNgos(
            List<NgoDirectoryResponse> ngos,
            String sortBy,
            String sortOrder) {

        Comparator<NgoDirectoryResponse> comparator;

        switch (sortBy.toLowerCase()) {
            case "focusarea":
                comparator = Comparator.comparing(NgoDirectoryResponse::getFocusArea);
                break;
            case "organizationname":
                comparator = Comparator.comparing(NgoDirectoryResponse::getOrganizationName);
                break;
            case "email":
                comparator = Comparator.comparing(NgoDirectoryResponse::getEmail);
                break;
            case "username":
            default:
                comparator = Comparator.comparing(NgoDirectoryResponse::getUsername);
                break;
        }

        if ("desc".equalsIgnoreCase(sortOrder)) {
            comparator = comparator.reversed();
        }

        return ngos.stream().sorted(comparator).collect(Collectors.toList());
    }

    private Page<LawyerDirectoryResponse> paginateLawyers(
            List<LawyerDirectoryResponse> lawyers,
            int page,
            int size) {

        int start = page * size;
        int end = Math.min(start + size, lawyers.size());

        if (start > lawyers.size()) {
            return new PageImpl<>(List.of(), PageRequest.of(page, size), lawyers.size());
        }

        List<LawyerDirectoryResponse> pageContent = lawyers.subList(start, end);
        return new PageImpl<>(pageContent, PageRequest.of(page, size), lawyers.size());
    }

    private Page<NgoDirectoryResponse> paginateNgos(
            List<NgoDirectoryResponse> ngos,
            int page,
            int size) {

        int start = page * size;
        int end = Math.min(start + size, ngos.size());

        if (start > ngos.size()) {
            return new PageImpl<>(List.of(), PageRequest.of(page, size), ngos.size());
        }

        List<NgoDirectoryResponse> pageContent = ngos.subList(start, end);
        return new PageImpl<>(pageContent, PageRequest.of(page, size), ngos.size());
    }

    // ==================== CONVERSION METHODS ====================

    private LawyerDirectoryResponse convertToLawyerResponse(User user) {
        return LawyerDirectoryResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .barNumber(user.getLawyerProfile().getBarNumber())
                .specialization(user.getLawyerProfile().getSpecialization())
                .verified(user.getApprovalStatus() == ApprovalStatus.APPROVED)
                .build();
    }

    private NgoDirectoryResponse convertToNgoResponse(User user) {
        return NgoDirectoryResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .organizationName(user.getNgoProfile().getOrganizationName())
                .registrationNumber(user.getNgoProfile().getRegistrationNumber())
                .focusArea(user.getNgoProfile().getFocusArea())
                .verified(user.getApprovalStatus() == ApprovalStatus.APPROVED)
                .build();
    }

}
