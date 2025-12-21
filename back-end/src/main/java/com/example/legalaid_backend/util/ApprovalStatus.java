package com.example.legalaid_backend.util;

public enum ApprovalStatus {
    PENDING,              // Initial state after registration
    APPROVED,             // Admin approved
    REJECTED,             // Admin rejected
    SUSPENDED,            // Admin suspended account
    REAPPROVAL_PENDING    // Changed details, awaiting re-approval
}
