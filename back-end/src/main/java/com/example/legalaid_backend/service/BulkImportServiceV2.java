package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.BulkImportResponse;
import com.example.legalaid_backend.DTO.CsvPreviewResponse;
import com.example.legalaid_backend.DTO.FlexibleImportRequest;
import com.example.legalaid_backend.DTO.ImportResultRow;
import com.example.legalaid_backend.entity.LawyerProfile;
import com.example.legalaid_backend.entity.NgoProfile;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BulkImportServiceV2 {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Preview CSV and suggest field mappings
     */
    public CsvPreviewResponse previewCsv(List<Map<String, String>> csvData, String role) {
        log.info("Previewing CSV with {} rows for role: {}", csvData.size(), role);

        if (csvData.isEmpty()) {
            throw new IllegalArgumentException("CSV is empty");
        }

        // Detect headers from first row
        List<String> detectedHeaders = new ArrayList<>(csvData.get(0).keySet());

        // Required fields based on role
        List<String> requiredFields = role.equals("LAWYER")
                ? Arrays.asList("username", "barNumber", "specialization", "location")
                : Arrays.asList("username", "organizationName", "registrationNumber", "focusArea", "location");

        // Auto-suggest mapping using fuzzy matching
        Map<String, String> suggestedMapping = autoDetectMapping(detectedHeaders, requiredFields);

        // Get sample rows (first 5)
        List<Map<String, String>> sampleRows = csvData.stream()
                .limit(5)
                .collect(Collectors.toList());

        return CsvPreviewResponse.builder()
                .detectedHeaders(detectedHeaders)
                .requiredFields(requiredFields)
                .suggestedMapping(suggestedMapping)
                .sampleRows(sampleRows)
                .totalRows(csvData.size())
                .build();
    }

    /**
     * Import lawyers with flexible field mapping
     */
    @Transactional
    public BulkImportResponse importLawyersV2(FlexibleImportRequest request) {
        log.info("Starting V2 import of {} lawyers with default password", request.getRows().size());

        List<ImportResultRow> results = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        // Get field mappings
        Map<String, String> mapping = request.getMapping().getFieldMapping();
        String encodedPassword = passwordEncoder.encode(request.getDefaultPassword());

        for (Map<String, String> row : request.getRows()) {
            try {
                // Map fields from CSV to our entities
                String username = getMappedValue(row, mapping, "username", true);
                String barNumber = getMappedValue(row, mapping, "barNumber", true);
                String specialization = getMappedValue(row, mapping, "specialization", true);
                String location = getMappedValue(row, mapping, "location", false);
                String email = getMappedValue(row, mapping, "email", false);

                // Generate email if not provided
                if (email == null || email.isBlank()) {
                    if (request.isGenerateEmails()) {
                        email = generateEmail(username, "lawyer");
                    } else {
                        throw new IllegalArgumentException("Email is required");
                    }
                }

                // Check if email already exists
                if (userRepository.existsByEmail(email)) {
                    throw new IllegalArgumentException("Email already exists: " + email);
                }

                // Create User
                User user = new User();
                user.setUsername(username);
                user.setEmail(email);
                user.setPassword(encodedPassword); // Same password for everyone
                user.setRole(Role.LAWYER);
                user.setLocation(location);
                user.setEnabled(true);
                user.setApprovalStatus(request.isAutoApprove()
                        ? ApprovalStatus.APPROVED
                        : ApprovalStatus.PENDING);

                // Create LawyerProfile
                LawyerProfile profile = new LawyerProfile();
                profile.setUser(user);
                profile.setBarNumber(barNumber);
                profile.setSpecialization(specialization);

                if (request.isAutoApprove()) {
                    profile.setLastApprovedBarNumber(barNumber);
                    profile.setLastApprovedSpecialization(specialization);
                }

                user.setLawyerProfile(profile);

                // Save
                userRepository.save(user);

                // Success result (don't include password in response for security)
                results.add(ImportResultRow.builder()
                        .username(username)
                        .email(email)
                        .generatedPassword(null) // Don't expose default password
                        .success(true)
                        .build());

                successCount++;
                log.info("Lawyer imported: {}", email);

            } catch (Exception e) {
                results.add(ImportResultRow.builder()
                        .username(row.get(mapping.getOrDefault("username", "username")))
                        .email(row.get(mapping.getOrDefault("email", "email")))
                        .success(false)
                        .errorMessage(e.getMessage())
                        .build());

                failureCount++;
                log.error("Failed to import lawyer: {}", e.getMessage());
            }
        }

        log.info("Import completed: {} success, {} failures", successCount, failureCount);

        return BulkImportResponse.builder()
                .totalRows(request.getRows().size())
                .successCount(successCount)
                .failureCount(failureCount)
                .results(results)
                .message(String.format("Import completed: %d successful, %d failed. Default password: %s",
                        successCount, failureCount, request.getDefaultPassword()))
                .build();
    }

    /**
     * Import NGOs with flexible field mapping
     */
    @Transactional
    public BulkImportResponse importNgosV2(FlexibleImportRequest request) {
        log.info("Starting V2 import of {} NGOs with default password", request.getRows().size());

        List<ImportResultRow> results = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        Map<String, String> mapping = request.getMapping().getFieldMapping();
        String encodedPassword = passwordEncoder.encode(request.getDefaultPassword());

        for (Map<String, String> row : request.getRows()) {
            try {
                // Map fields
                String organizationName = getMappedValue(row, mapping, "organizationName", true);
                String registrationNumber = getMappedValue(row, mapping, "registrationNumber", true);
                String focusArea = getMappedValue(row, mapping, "focusArea", true);
                String location = getMappedValue(row, mapping, "location", false);
                String email = getMappedValue(row, mapping, "email", false);
                
                // For NGOs, username is optional and defaults to organizationName
                String username = getMappedValue(row, mapping, "username", false);
                if (username == null || username.isBlank()) {
                    username = organizationName;
                }

                // Generate email if not provided
                if (email == null || email.isBlank()) {
                    if (request.isGenerateEmails()) {
                        email = generateEmail(username, "ngo");
                    } else {
                        throw new IllegalArgumentException("Email is required");
                    }
                }

                if (userRepository.existsByEmail(email)) {
                    throw new IllegalArgumentException("Email already exists: " + email);
                }

                // Create User
                User user = new User();
                user.setUsername(username);
                user.setEmail(email);
                user.setPassword(encodedPassword);
                user.setRole(Role.NGO);
                user.setLocation(location);
                user.setEnabled(true);
                user.setApprovalStatus(request.isAutoApprove()
                        ? ApprovalStatus.APPROVED
                        : ApprovalStatus.PENDING);

                // Create NgoProfile
                NgoProfile profile = new NgoProfile();
                profile.setUser(user);
                profile.setOrganizationName(organizationName);
                profile.setRegistrationNumber(registrationNumber);
                profile.setFocusArea(focusArea);

                if (request.isAutoApprove()) {
                    profile.setLastApprovedOrganizationName(organizationName);
                    profile.setLastApprovedRegistrationNumber(registrationNumber);
                    profile.setLastApprovedFocusArea(focusArea);
                }

                user.setNgoProfile(profile);

                // Save
                userRepository.save(user);

                results.add(ImportResultRow.builder()
                        .username(username)
                        .email(email)
                        .generatedPassword(null)
                        .success(true)
                        .build());

                successCount++;
                log.info("NGO imported: {}", email);

            } catch (Exception e) {
                results.add(ImportResultRow.builder()
                        .username(row.get(mapping.getOrDefault("username", "username")))
                        .email(row.get(mapping.getOrDefault("email", "email")))
                        .success(false)
                        .errorMessage(e.getMessage())
                        .build());

                failureCount++;
                log.error("Failed to import NGO: {}", e.getMessage());
            }
        }

        log.info("Import completed: {} success, {} failures", successCount, failureCount);

        return BulkImportResponse.builder()
                .totalRows(request.getRows().size())
                .successCount(successCount)
                .failureCount(failureCount)
                .results(results)
                .message(String.format("Import completed: %d successful, %d failed. Default password: %s",
                        successCount, failureCount, request.getDefaultPassword()))
                .build();
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get mapped value from CSV row
     */
    private String getMappedValue(
            Map<String, String> row,
            Map<String, String> mapping,
            String ourField,
            boolean required) {

        // Get the CSV column name that maps to our field
        String csvColumn = mapping.get(ourField);

        if (csvColumn == null) {
            if (required) {
                throw new IllegalArgumentException("Missing mapping for required field: " + ourField);
            }
            return null;
        }

        String value = row.get(csvColumn);

        if ((value == null || value.isBlank()) && required) {
            throw new IllegalArgumentException("Missing required field: " + ourField + " (CSV column: " + csvColumn + ")");
        }

        return value != null ? value.trim() : null;
    }

    /**
     * Auto-detect field mapping using fuzzy matching
     */
    private Map<String, String> autoDetectMapping(List<String> csvHeaders, List<String> requiredFields) {
        Map<String, String> mapping = new HashMap<>();

        for (String requiredField : requiredFields) {
            String bestMatch = findBestMatch(requiredField, csvHeaders);
            if (bestMatch != null) {
                mapping.put(requiredField, bestMatch);
            }
        }

        return mapping;
    }

    /**
     * Find best matching CSV header for our field using fuzzy logic
     */
    private String findBestMatch(String ourField, List<String> csvHeaders) {
        // Define synonyms/variations
        Map<String, List<String>> synonyms = new HashMap<>();
        synonyms.put("username", Arrays.asList("name", "user_name", "full_name", "fullname", "person_name"));
        synonyms.put("email", Arrays.asList("e-mail", "email_address", "mail", "contact_email"));
        synonyms.put("barNumber", Arrays.asList("bar_number", "license", "license_number", "license_no", "bar_no", "registration"));
        synonyms.put("specialization", Arrays.asList("practice_area", "area", "specialty", "field", "expertise", "domain"));
        synonyms.put("organizationName", Arrays.asList("organization", "org_name", "ngo_name", "company", "institution"));
        synonyms.put("registrationNumber", Arrays.asList("registration_no", "reg_number", "reg_no", "registration", "id"));
        synonyms.put("focusArea", Arrays.asList("focus", "area", "domain", "field", "specialty", "cause"));
        synonyms.put("location", Arrays.asList("city", "state", "province", "region", "address", "place", "jurisdiction"));

        // Exact match (case-insensitive)
        for (String header : csvHeaders) {
            if (header.equalsIgnoreCase(ourField)) {
                return header;
            }
        }

        // Synonym match
        List<String> possibleMatches = synonyms.get(ourField);
        if (possibleMatches != null) {
            for (String header : csvHeaders) {
                for (String synonym : possibleMatches) {
                    if (header.toLowerCase().contains(synonym.toLowerCase()) ||
                            synonym.toLowerCase().contains(header.toLowerCase())) {
                        return header;
                    }
                }
            }
        }

        return null; // No match found
    }

    /**
     * Generate email from username
     */
    private String generateEmail(String username, String type) {
        String cleanName = username.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", ".");

        return cleanName + "." + type + "@legalaid.system";
    }
}
