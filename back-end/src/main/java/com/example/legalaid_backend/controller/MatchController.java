package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.GenerateMatchesResponse;
import com.example.legalaid_backend.DTO.MatchRejectRequest;
import com.example.legalaid_backend.DTO.MatchResponse;
import com.example.legalaid_backend.DTO.MatchResultDTO;
import com.example.legalaid_backend.entity.CaseAttachment;
import com.example.legalaid_backend.repository.AttachmentRepository;
import com.example.legalaid_backend.service.MatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final AttachmentRepository attachmentRepository;

    /**
     * GENERATE MATCHES FOR A CASE (Citizen)
     * POST /api/matches/case/{caseId}/generate
     */
    @PostMapping("/case/{caseId}/generate")
    public ResponseEntity<GenerateMatchesResponse> generateMatches(
            @PathVariable Long caseId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/case/" + caseId + "/generate");

        try {
            log.info("User {} requesting match generation for case {}", auth.getName(), caseId);

            GenerateMatchesResponse response = matchService.generateMatches(caseId);

            log.info("Successfully generated {} matches for case {}",
                    response.getTotalMatches(), caseId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to generate matches for case {}: {}", caseId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET MATCHES FOR A CASE (Citizen) - Public format
     * GET /api/matches/case/{caseId}/results
     */
    @GetMapping("/case/{caseId}/results")
    public ResponseEntity<Map<String, Object>> getMatchResults(
            @PathVariable Long caseId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/case/" + caseId + "/results");

        try {
            log.info("User {} requesting match results for case {}", auth.getName(), caseId);

            List<MatchResultDTO> results = matchService.getMatchesForCase(caseId);

            Map<String, Object> response = new HashMap<>();
            response.put("results", results);
            response.put("totalMatches", results.size());

            log.info("Returning {} match results for case {}", results.size(), caseId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to get match results for case {}: {}", caseId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET DETAILED MATCHES FOR A CASE (Citizen)
     * GET /api/matches/case/{caseId}
     */
    @GetMapping("/case/{caseId}")
    public ResponseEntity<GenerateMatchesResponse> getMatchesForCase(
            @PathVariable Long caseId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/case/" + caseId);

        try {
            log.info("User {} requesting matches for case {}", auth.getName(), caseId);

            // Convert to GenerateMatchesResponse format
            List<MatchResultDTO> results = matchService.getMatchesForCase(caseId);

            // Create a response similar to generate matches
            GenerateMatchesResponse response = new GenerateMatchesResponse();
            response.setTotalMatches(results.size());
            response.setMessage("Retrieved " + results.size() + " matches");
            // Note: This returns MatchResultDTO instead of MatchResponse,
            // but we can keep it simple for now

            log.info("Returning {} matches for case {}", results.size(), caseId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to get matches for case {}: {}", caseId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * SELECT MATCH (Citizen) - Citizen selects this lawyer/NGO for their case
     * POST /api/matches/{matchId}/select
     */
    @PostMapping("/{matchId}/select")
    public ResponseEntity<MatchResponse> selectMatch(
            @PathVariable Long matchId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/" + matchId + "/select");

        try {
            log.info("Citizen {} selecting match {}", auth.getName(), matchId);

            MatchResponse response = matchService.selectMatch(matchId);

            log.info("Match {} selected by citizen {}", matchId, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to select match {}: {}", matchId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * REJECT MATCH (Citizen) - Citizen rejects this match
     * POST /api/matches/{matchId}/reject
     */
    @PostMapping("/{matchId}/reject")
    public ResponseEntity<MatchResponse> rejectMatch(
            @PathVariable Long matchId,
            @RequestBody(required = false) MatchRejectRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/" + matchId + "/reject");

        try {
            log.info("Citizen {} rejecting match {}", auth.getName(), matchId);

            String reason = request != null ? request.getReason() : null;
            MatchResponse response = matchService.rejectMatchByCitizen(matchId, reason);

            log.info("Match {} rejected by citizen {}", matchId, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to reject match {}: {}", matchId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET MY MATCHES (Citizen) - View all matches for all my cases
     * GET /api/matches/my
     */
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyMatches(Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/my");

        try {
            log.info("Citizen {} requesting all their matches", auth.getName());

            List<MatchResponse> matches = matchService.getMyMatches();

            Map<String, Object> response = new HashMap<>();
            response.put("matches", matches);
            response.put("totalMatches", matches.size());

            log.info("Returning {} matches for citizen {}", matches.size(), auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to get matches for citizen {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET ASSIGNED CASES (Lawyer/NGO) - View cases that citizens have selected you
     * for
     * GET /api/matches/assigned-cases
     */
    @GetMapping("/assigned-cases")
    public ResponseEntity<List<MatchResponse>> getAssignedCases(Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/assigned-cases");

        try {
            log.info("Provider {} requesting assigned cases", auth.getName());

            List<MatchResponse> cases = matchService.getAssignedCases();

            log.info("Returning {} assigned cases for provider {}", cases.size(), auth.getName());

            return ResponseEntity.ok(cases);

        } catch (Exception e) {
            log.error("Failed to get assigned cases for provider {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * ACCEPT CASE ASSIGNMENT (Lawyer/NGO) - Accept a case that citizen selected you
     * for
     * POST /api/matches/{matchId}/accept-assignment
     */
    @PostMapping("/{matchId}/accept-assignment")
    public ResponseEntity<MatchResponse> acceptCaseAssignment(
            @PathVariable Long matchId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/" + matchId + "/accept-assignment");

        try {
            log.info("Provider {} accepting case assignment {}", auth.getName(), matchId);

            MatchResponse response = matchService.acceptCaseAssignment(matchId);

            log.info("Case assignment {} accepted by provider {}", matchId, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to accept case assignment {}: {}", matchId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * DECLINE CASE ASSIGNMENT (Lawyer/NGO) - Decline a case that citizen selected
     * you for
     * POST /api/matches/{matchId}/decline-assignment
     */
    @PostMapping("/{matchId}/decline-assignment")
    public ResponseEntity<MatchResponse> declineCaseAssignment(
            @PathVariable Long matchId,
            @RequestBody(required = false) MatchRejectRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/" + matchId + "/decline-assignment");

        try {
            log.info("Provider {} declining case assignment {}", auth.getName(), matchId);

            String reason = request != null ? request.getReason() : null;
            MatchResponse response = matchService.declineCaseAssignment(matchId, reason);

            log.info("Case assignment {} declined by provider {}", matchId, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to decline case assignment {}: {}", matchId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * DOWNLOAD CASE ATTACHMENT (Lawyer/NGO)
     * GET /api/matches/case/{caseId}/attachment/{attachmentId}
     */
    @GetMapping("/case/{caseId}/attachment/{attachmentId}")
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable Long caseId,
            @PathVariable Long attachmentId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/matches/case/" + caseId + "/attachment/" + attachmentId);

        try {
            log.info("Provider {} downloading attachment {} for case {}", auth.getName(), attachmentId, caseId);

            CaseAttachment attachment = attachmentRepository.findById(attachmentId)
                    .orElseThrow(() -> new RuntimeException("Attachment not found"));

            // Verify the attachment belongs to the requested case
            if (!attachment.getLegalCase().getId().equals(caseId)) {
                throw new RuntimeException("Attachment does not belong to this case");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(attachment.getFileType()));
            headers.setContentDispositionFormData("attachment", attachment.getFileName());
            headers.setContentLength(attachment.getContent().length);

            log.info("Successfully retrieved attachment {} for case {}", attachmentId, caseId);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(attachment.getContent());

        } catch (Exception e) {
            log.error("Failed to download attachment {} for case {}: {}", attachmentId, caseId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }
}
