package com.example.legalaid_backend.util;

import com.example.legalaid_backend.entity.Match;
import com.example.legalaid_backend.entity.User;

public class ChatUtils {

    /**
     * Check if chat is allowed for a match based on status
     *
     * Chat is enabled only when:
     * - ACCEPTED_BY_PROVIDER: Provider has accepted the match
     */
    public static boolean canChat(Match match) {
        if (match == null || match.getStatus() == null) {
            return false;
        }

        MatchStatus status = match.getStatus();
        return status == MatchStatus.ACCEPTED_BY_PROVIDER;
    }

    /**
     * Check if a user is participant in a match
     *
     * Participant can be:
     * - Citizen who created the case
     * - Lawyer assigned to the match
     * - NGO assigned to the match
     */
    public static boolean isParticipant(Match match, Long userId) {
        if (match == null || userId == null) {
            return false;
        }

        // Check if user is the citizen
        if (match.getLegalCase() != null &&
                match.getLegalCase().getCreatedBy() != null &&
                match.getLegalCase().getCreatedBy().getId().equals(userId)) {
            return true;
        }

        // Check if user is the lawyer
        if (match.getLawyer() != null && match.getLawyer().getId().equals(userId)) {
            return true;
        }

        // Check if user is the NGO
        if (match.getNgo() != null && match.getNgo().getId().equals(userId)) {
            return true;
        }

        return false;
    }

    /**
     * Get the service provider (lawyer or NGO) from a match
     */
    public static User getProvider(Match match) {
        if (match == null) {
            return null;
        }
        return match.getLawyer() != null ? match.getLawyer() : match.getNgo();
    }

    /**
     * Get the other participant in a conversation
     *
     * If current user is citizen, returns provider (lawyer/NGO)
     * If current user is provider, returns citizen
     */
    public static User getOtherParticipant(Match match, Long currentUserId) {
        if (match == null || currentUserId == null) {
            throw new IllegalArgumentException("Match and user ID cannot be null");
        }

        // If current user is the citizen, return the provider
        if (match.getLegalCase() != null &&
                match.getLegalCase().getCreatedBy() != null &&
                match.getLegalCase().getCreatedBy().getId().equals(currentUserId)) {
            return getProvider(match);
        }

        // If current user is lawyer
        if (match.getLawyer() != null && match.getLawyer().getId().equals(currentUserId)) {
            return match.getLegalCase().getCreatedBy();
        }

        // If current user is NGO
        if (match.getNgo() != null && match.getNgo().getId().equals(currentUserId)) {
            return match.getLegalCase().getCreatedBy();
        }

        throw new IllegalArgumentException("User is not a participant in this match");
    }

    /**
     * Get provider type string (LAWYER or NGO)
     */
    public static String getProviderType(Match match) {
        if (match == null) {
            return "UNKNOWN";
        }
        if (match.getLawyer() != null) {
            return "LAWYER";
        }
        if (match.getNgo() != null) {
            return "NGO";
        }
        return "UNKNOWN";
    }

    /**
     * Check if match is currently active (accepted by provider)
     */
    public static boolean isMatchActive(Match match) {
        if (match == null || match.getStatus() == null) {
            return false;
        }
        return match.getStatus() == MatchStatus.ACCEPTED_BY_PROVIDER;
    }

    /**
     * Check if match is pending provider response
     */
    public static boolean isMatchPending(Match match) {
        if (match == null || match.getStatus() == null) {
            return false;
        }
        return match.getStatus() == MatchStatus.SELECTED_BY_CITIZEN;
    }

    /**
     * Validate that message content is not empty
     */
    public static void validateMessageContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }
        if (content.length() > 5000) {
            throw new IllegalArgumentException("Message content too long (max 5000 characters)");
        }
    }
}
