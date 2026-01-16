package com.example.legalaid_backend.util;

public enum CaseStatus {
    SUBMITTED,              // Case submitted by citizen, waiting for matching
    PENDING_APPROVAL,       // Matched with lawyer/NGO, waiting for their approval
    ACCEPTED,               // Lawyer/NGO accepted the case
    IN_PROGRESS,           // Case work is in progress
    UNDER_REVIEW,          // Case is under review
    RESOLVED,              // Case has been resolved
    CLOSED,                // Case is closed
    REJECTED,              // Case was rejected by lawyer/NGO
    CANCELLED              // Case was cancelled by citizen
}
