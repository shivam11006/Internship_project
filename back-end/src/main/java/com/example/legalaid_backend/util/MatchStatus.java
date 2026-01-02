package com.example.legalaid_backend.util;

public enum MatchStatus {
    PENDING,                    // Initial state: Match generated, waiting for citizen to select
    SELECTED_BY_CITIZEN,        // Citizen selected this provider, waiting for provider response
    ACCEPTED_BY_PROVIDER,       // Provider accepted the case assignment
    REJECTED_BY_CITIZEN,        // Citizen rejected this match
    REJECTED_BY_PROVIDER,       // Provider declined the case assignment
    EXPIRED                     // Match expired (if needed)
}
