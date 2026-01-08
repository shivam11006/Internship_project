package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.GenerateMatchesResponse;
import com.example.legalaid_backend.DTO.MatchResponse;
import com.example.legalaid_backend.DTO.MatchResultDTO;
import com.example.legalaid_backend.entity.Case;
import com.example.legalaid_backend.entity.Match;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.CaseRepository;
import com.example.legalaid_backend.repository.MatchRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.MatchStatus;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchService {

    private final CaseRepository caseRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    // =========================
    // GENERATE MATCHES FOR A CASE
    // =========================
    @Transactional
    public GenerateMatchesResponse generateMatches(Long caseId) {

        User currentUser = getCurrentUser();

        // Verify case ownership
        Case legalCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        if (!legalCase.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You can only generate matches for your own cases");
        }

        log.info("Generating matches for case ID: {} by user: {}", caseId, currentUser.getEmail());

        // Get approved lawyers and NGOs
        List<User> lawyers = userRepository.findByRoleAndApprovalStatus(Role.LAWYER, ApprovalStatus.APPROVED);
        List<User> ngos = userRepository.findByRoleAndApprovalStatus(Role.NGO, ApprovalStatus.APPROVED);

        log.info("Found {} approved lawyers and {} approved NGOs", lawyers.size(), ngos.size());

        List<Match> newMatches = new ArrayList<>();

        // Match with lawyers
        for (User lawyer : lawyers) {
            if (lawyer.getLawyerProfile() == null)
                continue;

            // Check if match already exists
            if (matchRepository.findByLegalCaseIdAndLawyerId(caseId, lawyer.getId()).isPresent()) {
                log.debug("Match already exists for case {} and lawyer {}", caseId, lawyer.getId());
                continue;
            }

            double score = calculateMatchScore(legalCase, lawyer, Role.LAWYER);

            if (score > 30) { // Only create matches with positive scores
                Match match = new Match();
                match.setLegalCase(legalCase);
                match.setLawyer(lawyer);
                match.setMatchScore(score);
                match.setMatchReason(generateMatchReason(legalCase, lawyer, Role.LAWYER));
                match.setStatus(MatchStatus.PENDING);
                newMatches.add(match);
            }
        }

        // Match with NGOs
        for (User ngo : ngos) {
            if (ngo.getNgoProfile() == null)
                continue;

            // Check if match already exists
            if (matchRepository.findByLegalCaseIdAndNgoId(caseId, ngo.getId()).isPresent()) {
                log.debug("Match already exists for case {} and NGO {}", caseId, ngo.getId());
                continue;
            }

            double score = calculateMatchScore(legalCase, ngo, Role.NGO);

            if (score > 30) { // Only create matches with positive scores
                Match match = new Match();
                match.setLegalCase(legalCase);
                match.setNgo(ngo);
                match.setMatchScore(score);
                match.setMatchReason(generateMatchReason(legalCase, ngo, Role.NGO));
                match.setStatus(MatchStatus.PENDING);
                newMatches.add(match);
            }
        }

        // Save all new matches
        List<Match> savedMatches = matchRepository.saveAll(newMatches);

        log.info("Created {} new matches for case {}", savedMatches.size(), caseId);

        // Get all matches for this case (including existing ones)
        List<Match> allMatches = matchRepository.findByLegalCaseId(caseId);

        List<MatchResponse> matchResponses = allMatches.stream()
                .map(this::toMatchResponse)
                .sorted(Comparator.comparing(MatchResponse::getMatchScore).reversed())
                .collect(Collectors.toList());

        GenerateMatchesResponse response = new GenerateMatchesResponse();
        response.setTotalMatches(matchResponses.size());
        response.setMatches(matchResponses);
        response.setMessage(savedMatches.size() + " new matches generated. Total matches: " + allMatches.size());

        return response;
    }

    // =========================
    // GET MATCHES FOR A CASE (Public format for directory-style listing)
    // =========================
    public List<MatchResultDTO> getMatchesForCase(Long caseId) {

        User currentUser = getCurrentUser();

        // Verify case ownership
        Case legalCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        if (!legalCase.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You can only view matches for your own cases");
        }

        // Only return PENDING matches - accepted/rejected ones should not appear in
        // this view
        List<Match> matches = matchRepository.findByLegalCaseId(caseId);

        return matches.stream()
                .filter(match -> match.getStatus() == MatchStatus.PENDING)
                .map(this::toMatchResultDTO)
                .sorted(Comparator.comparing(MatchResultDTO::getScore).reversed())
                .collect(Collectors.toList());
    }

    // =========================
    // SELECT MATCH (Citizen)
    // =========================
    @Transactional
    public MatchResponse selectMatch(Long matchId) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.CITIZEN) {
            throw new RuntimeException("Only citizens can select matches");
        }

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // Verify case ownership
        if (!match.getLegalCase().getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You can only select matches for your own cases");
        }

        if (match.getStatus() != MatchStatus.PENDING) {
            throw new RuntimeException("Only pending matches can be selected");
        }

        match.setStatus(MatchStatus.SELECTED_BY_CITIZEN);

        Match updatedMatch = matchRepository.save(match);

        log.info("Match {} selected by citizen {}", matchId, currentUser.getEmail());

        return toMatchResponse(updatedMatch);
    }

    // =========================
    // REJECT MATCH (Citizen)
    // =========================
    @Transactional
    public MatchResponse rejectMatchByCitizen(Long matchId, String reason) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.CITIZEN) {
            throw new RuntimeException("Only citizens can reject matches");
        }

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // Verify case ownership
        if (!match.getLegalCase().getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You can only reject matches for your own cases");
        }

        if (match.getStatus() != MatchStatus.PENDING) {
            throw new RuntimeException("Only pending matches can be rejected");
        }

        match.setStatus(MatchStatus.REJECTED_BY_CITIZEN);
        match.setRejectedAt(LocalDateTime.now());
        match.setRejectionReason(reason != null ? reason : "Not interested");

        Match updatedMatch = matchRepository.save(match);

        log.info("Match {} rejected by citizen {}", matchId, currentUser.getEmail());

        return toMatchResponse(updatedMatch);
    }

    // =========================    // GET MY MATCHES (For Citizens)
    // =========================
    public List<MatchResponse> getMyMatches() {
        User currentUser = getCurrentUser();
        
        if (currentUser.getRole() != Role.CITIZEN) {
            throw new RuntimeException("Only citizens can view their matches");
        }
        
        log.info("Fetching all matches for citizen: {}", currentUser.getId());
        
        // Get all cases created by this citizen
        List<Case> myCases = caseRepository.findByCreatedBy(currentUser);
        
        // Get all matches for these cases
        List<Match> allMatches = new ArrayList<>();
        for (Case legalCase : myCases) {
            List<Match> caseMatches = matchRepository.findByLegalCaseId(legalCase.getId());
            allMatches.addAll(caseMatches);
        }
        
        log.info("Found {} total matches across {} cases", allMatches.size(), myCases.size());
        
        // Convert to response DTOs
        return allMatches.stream()
                .map(this::toMatchResponse)
                .sorted(Comparator.comparing(MatchResponse::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    // =========================    // GET ASSIGNED CASES (Lawyer/NGO)
    // =========================
    public List<MatchResponse> getAssignedCases() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.LAWYER && currentUser.getRole() != Role.NGO) {
            throw new RuntimeException("Only lawyers and NGOs can view assigned cases");
        }

        // Get matches where citizen has selected this provider
        List<Match> matches = matchRepository.findByProviderId(currentUser.getId());

        // Filter to only show matches that are SELECTED_BY_CITIZEN or
        // ACCEPTED_BY_PROVIDER
        return matches.stream()
                .filter(m -> m.getStatus() == MatchStatus.SELECTED_BY_CITIZEN ||
                        m.getStatus() == MatchStatus.ACCEPTED_BY_PROVIDER)
                .map(this::toMatchResponse)
                .sorted(Comparator.comparing(MatchResponse::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    // =========================
    // ACCEPT CASE ASSIGNMENT (Lawyer/NGO)
    // =========================
    @Transactional
    public MatchResponse acceptCaseAssignment(Long matchId) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.LAWYER && currentUser.getRole() != Role.NGO) {
            throw new RuntimeException("Only lawyers and NGOs can accept case assignments");
        }

        // Use pessimistic lock to prevent race conditions
        Match match = matchRepository.findByIdWithLock(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // Verify the user is the matched provider
        if (match.getLawyer() != null && !match.getLawyer().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You are not assigned to this case");
        }
        if (match.getNgo() != null && !match.getNgo().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You are not assigned to this case");
        }

        // Check current status - must be SELECTED_BY_CITIZEN to accept
        if (match.getStatus() == MatchStatus.EXPIRED) {
            throw new RuntimeException("This case has already been accepted by another provider. You can no longer accept it.");
        }
        
        if (match.getStatus() != MatchStatus.SELECTED_BY_CITIZEN) {
            throw new RuntimeException("Only cases selected by citizens can be accepted. Current status: " + match.getStatus());
        }

        // Double-check if another provider has already accepted this case
        Long caseId = match.getLegalCase().getId();
        long acceptedCount = matchRepository.countAcceptedMatchesForCase(caseId);
        if (acceptedCount > 0) {
            // Mark this match as expired since another provider already accepted
            match.setStatus(MatchStatus.EXPIRED);
            match.setRejectionReason("Another provider has accepted this case");
            matchRepository.save(match);
            throw new RuntimeException("This case has already been accepted by another provider. You can no longer accept it.");
        }

        // Accept the case
        match.setStatus(MatchStatus.ACCEPTED_BY_PROVIDER);
        match.setAcceptedAt(LocalDateTime.now());

        Match updatedMatch = matchRepository.save(match);

        // Expire all other SELECTED_BY_CITIZEN matches for this case
        List<Match> otherSelectedMatches = matchRepository.findByCaseIdAndStatus(caseId, MatchStatus.SELECTED_BY_CITIZEN);
        for (Match otherMatch : otherSelectedMatches) {
            if (!otherMatch.getId().equals(matchId)) {
                otherMatch.setStatus(MatchStatus.EXPIRED);
                otherMatch.setRejectionReason("Another provider has accepted this case");
                matchRepository.save(otherMatch);
                log.info("Match {} expired because provider {} accepted case {}", 
                        otherMatch.getId(), currentUser.getEmail(), caseId);
            }
        }

        log.info("Case assignment {} accepted by provider {}", matchId, currentUser.getEmail());

        return toMatchResponse(updatedMatch);
    }

    // =========================
    // DECLINE CASE ASSIGNMENT (Lawyer/NGO)
    // =========================
    @Transactional
    public MatchResponse declineCaseAssignment(Long matchId, String reason) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.LAWYER && currentUser.getRole() != Role.NGO) {
            throw new RuntimeException("Only lawyers and NGOs can decline case assignments");
        }

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // Verify the user is the matched provider
        if (match.getLawyer() != null && !match.getLawyer().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You are not assigned to this case");
        }
        if (match.getNgo() != null && !match.getNgo().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You are not assigned to this case");
        }

        if (match.getStatus() != MatchStatus.SELECTED_BY_CITIZEN) {
            throw new RuntimeException("Only cases selected by citizens can be declined");
        }

        match.setStatus(MatchStatus.REJECTED_BY_PROVIDER);
        match.setRejectedAt(LocalDateTime.now());
        match.setRejectionReason(reason != null ? reason : "Unable to take this case");

        Match updatedMatch = matchRepository.save(match);

        log.info("Case assignment {} declined by provider {}", matchId, currentUser.getEmail());

        return toMatchResponse(updatedMatch);
    }

    // =========================
    // SCORING ALGORITHM
    // =========================
    private double calculateMatchScore(Case legalCase, User provider, Role providerRole) {

        double score = 0.0;
        int factors = 0;

        // 1. Expertise/Focus Area Match (40 points max)
        double expertiseScore = calculateExpertiseScore(legalCase, provider, providerRole);
        score += expertiseScore;
        factors++;

        // 2. Location Match (30 points max)
        double locationScore = calculateLocationScore(legalCase, provider);
        score += locationScore;
        factors++;

        // 3. Language Match (20 points max)
        double languageScore = calculateLanguageScore(legalCase, provider, providerRole);
        score += languageScore;
        factors++;

        // 4. Verification Status (10 points)
        if (provider.getApprovalStatus() == ApprovalStatus.APPROVED) {
            score += 10.0;
        }
        factors++;

        log.debug("Match score for {} ({}): Expertise={}, Location={}, Language={}, Total={}",
                provider.getUsername(), providerRole, expertiseScore, locationScore, languageScore, score);

        return Math.min(100.0, score); // Cap at 100
    }

    private double calculateExpertiseScore(Case legalCase, User provider, Role providerRole) {

        if (legalCase.getExpertiseTags() == null || legalCase.getExpertiseTags().isEmpty()) {
            return 20.0; // Base score if no expertise specified
        }

        String providerExpertise = "";

        if (providerRole == Role.LAWYER && provider.getLawyerProfile() != null) {
            providerExpertise = provider.getLawyerProfile().getSpecialization();
        } else if (providerRole == Role.NGO && provider.getNgoProfile() != null) {
            providerExpertise = provider.getNgoProfile().getFocusArea();
        }

        if (providerExpertise == null || providerExpertise.isEmpty()) {
            return 10.0; // Low score if provider has no expertise listed
        }

        String lowerProviderExpertise = providerExpertise.toLowerCase();
        String caseType = legalCase.getCaseType() != null ? legalCase.getCaseType().toLowerCase() : "";

        int matchCount = 0;
        int totalTags = legalCase.getExpertiseTags().size();

        // Check if case type matches
        if (!caseType.isEmpty() && lowerProviderExpertise.contains(caseType)) {
            return 40.0; // Perfect match
        }

        // Check expertise tags
        for (String tag : legalCase.getExpertiseTags()) {
            if (lowerProviderExpertise.contains(tag.toLowerCase())) {
                matchCount++;
            }
        }

        if (matchCount > 0) {
            return 20.0 + (20.0 * matchCount / totalTags); // 20-40 based on match ratio
        }

        return 10.0; // Minimal score
    }

    private double calculateLocationScore(Case legalCase, User provider) {

        if (legalCase.getLocation() == null || legalCase.getLocation().isEmpty()) {
            return 15.0; // Neutral score if no location specified
        }

        String caseLocation = legalCase.getLocation().toLowerCase();
        String providerLocation = provider.getLocation() != null ? provider.getLocation().toLowerCase() : "";

        if (providerLocation.isEmpty()) {
            return 10.0; // Low score if provider has no location
        }

        // Exact match
        if (caseLocation.equals(providerLocation)) {
            return 30.0;
        }

        // Partial match (city or state)
        String[] caseParts = caseLocation.split(",");
        String[] providerParts = providerLocation.split(",");

        for (String casePart : caseParts) {
            for (String providerPart : providerParts) {
                if (casePart.trim().equals(providerPart.trim())) {
                    return 20.0; // Partial match
                }
            }
        }

        return 5.0; // No match
    }

    private double calculateLanguageScore(Case legalCase, User provider, Role providerRole) {

        if (legalCase.getPreferredLanguage() == null || legalCase.getPreferredLanguage().isEmpty()) {
            return 10.0; // Neutral score if no language preference
        }

        String preferredLang = legalCase.getPreferredLanguage().toLowerCase();
        String providerLanguages = "";

        if (providerRole == Role.LAWYER && provider.getLawyerProfile() != null) {
            providerLanguages = provider.getLawyerProfile().getLanguages();
        } else if (providerRole == Role.NGO && provider.getNgoProfile() != null) {
            providerLanguages = provider.getNgoProfile().getLanguages();
        }

        if (providerLanguages == null || providerLanguages.isEmpty()) {
            return 5.0; // Low score if provider has no languages listed
        }

        String lowerProviderLanguages = providerLanguages.toLowerCase();

        if (lowerProviderLanguages.contains(preferredLang)) {
            return 20.0; // Perfect match
        }

        return 5.0; // No match
    }

    private String generateMatchReason(Case legalCase, User provider, Role providerRole) {

        List<String> reasons = new ArrayList<>();

        // Expertise match
        String providerExpertise = "";
        if (providerRole == Role.LAWYER && provider.getLawyerProfile() != null) {
            providerExpertise = provider.getLawyerProfile().getSpecialization();
        } else if (providerRole == Role.NGO && provider.getNgoProfile() != null) {
            providerExpertise = provider.getNgoProfile().getFocusArea();
        }

        if (providerExpertise != null && !providerExpertise.isEmpty()) {
            if (legalCase.getCaseType() != null &&
                    providerExpertise.toLowerCase().contains(legalCase.getCaseType().toLowerCase())) {
                reasons.add("Expertise matches case type");
            } else if (legalCase.getExpertiseTags() != null) {
                for (String tag : legalCase.getExpertiseTags()) {
                    if (providerExpertise.toLowerCase().contains(tag.toLowerCase())) {
                        reasons.add("Expertise in " + tag);
                        break;
                    }
                }
            }
        }

        // Location match
        if (legalCase.getLocation() != null && provider.getLocation() != null) {
            if (legalCase.getLocation().equalsIgnoreCase(provider.getLocation())) {
                reasons.add("Same location");
            } else if (legalCase.getLocation().toLowerCase().contains(provider.getLocation().toLowerCase()) ||
                    provider.getLocation().toLowerCase().contains(legalCase.getLocation().toLowerCase())) {
                reasons.add("Nearby location");
            }
        }

        // Language match
        String providerLanguages = "";
        if (providerRole == Role.LAWYER && provider.getLawyerProfile() != null) {
            providerLanguages = provider.getLawyerProfile().getLanguages();
        } else if (providerRole == Role.NGO && provider.getNgoProfile() != null) {
            providerLanguages = provider.getNgoProfile().getLanguages();
        }

        if (legalCase.getPreferredLanguage() != null && providerLanguages != null) {
            if (providerLanguages.toLowerCase().contains(legalCase.getPreferredLanguage().toLowerCase())) {
                reasons.add("Language: " + legalCase.getPreferredLanguage());
            }
        }

        // Verification
        if (provider.getApprovalStatus() == ApprovalStatus.APPROVED) {
            reasons.add("Verified provider");
        }

        return reasons.isEmpty() ? "General match" : String.join(", ", reasons);
    }

    // =========================
    // CONVERSION METHODS
    // =========================
    private MatchResponse toMatchResponse(Match match) {

        MatchResponse response = new MatchResponse();
        response.setId(match.getId());
        response.setCaseId(match.getLegalCase().getId());
        response.setCaseTitle(match.getLegalCase().getTitle());
        response.setCaseType(match.getLegalCase().getCaseType());
        response.setCaseLocation(match.getLegalCase().getLocation());
        response.setCaseDescription(match.getLegalCase().getDescription());
        response.setCasePriority(
                match.getLegalCase().getPriority() != null ? match.getLegalCase().getPriority().toString() : null);
        response.setStatus(match.getStatus().toString());
        response.setMatchScore(match.getMatchScore());
        response.setMatchReason(match.getMatchReason());
        response.setRejectionReason(match.getRejectionReason());
        response.setCreatedAt(match.getCreatedAt());
        response.setAcceptedAt(match.getAcceptedAt());
        response.setRejectedAt(match.getRejectedAt());

        // Add citizen information
        User citizen = match.getLegalCase().getCreatedBy();
        if (citizen != null) {
            response.setCitizenName(citizen.getUsername());
            response.setCitizenEmail(citizen.getEmail());
        }

        if (match.getLawyer() != null) {
            User lawyer = match.getLawyer();
            response.setProviderId(lawyer.getId());
            response.setProviderName(lawyer.getUsername());
            response.setProviderType("LAWYER");
            response.setProviderLocation(lawyer.getLocation());
            if (lawyer.getLawyerProfile() != null) {
                response.setProviderSpecialization(lawyer.getLawyerProfile().getSpecialization());
            }
        } else if (match.getNgo() != null) {
            User ngo = match.getNgo();
            response.setProviderId(ngo.getId());
            response.setProviderName(ngo.getUsername());
            response.setProviderType("NGO");
            response.setProviderLocation(ngo.getLocation());
            if (ngo.getNgoProfile() != null) {
                response.setProviderSpecialization(ngo.getNgoProfile().getFocusArea());
            }
        }

        return response;
    }

    private MatchResultDTO toMatchResultDTO(Match match) {

        MatchResultDTO dto = new MatchResultDTO();
        dto.setSource("REGISTERED");
        dto.setMatchId(match.getId());
        dto.setScore(match.getMatchScore());
        dto.setCanInteract(match.getStatus() == MatchStatus.PENDING);
        dto.setStatus(match.getStatus().name());

        if (match.getLawyer() != null) {
            User lawyer = match.getLawyer();
            dto.setProviderType("LAWYER");
            dto.setName(lawyer.getUsername());
            dto.setCity(lawyer.getLocation());
            dto.setVerified(lawyer.getApprovalStatus() == ApprovalStatus.APPROVED);
            if (lawyer.getLawyerProfile() != null) {
                dto.setExpertise(lawyer.getLawyerProfile().getSpecialization());
            }
        } else if (match.getNgo() != null) {
            User ngo = match.getNgo();
            dto.setProviderType("NGO");
            dto.setName(ngo.getUsername());
            dto.setCity(ngo.getLocation());
            dto.setVerified(ngo.getApprovalStatus() == ApprovalStatus.APPROVED);
            if (ngo.getNgoProfile() != null) {
                dto.setExpertise(ngo.getNgoProfile().getFocusArea());
            }
        }

        return dto;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
