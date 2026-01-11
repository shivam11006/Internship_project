package com.example.legalaid_backend.util;

public enum NotificationType {
    MATCH_FOUND("New Match Found"),
    MATCH_ACCEPTED("Match Accepted"),
    MATCH_REJECTED("Match Rejected"),
    MESSAGE_RECEIVED("Message Received"),
    APPOINTMENT_SCHEDULED("Appointment Scheduled"),
    APPOINTMENT_UPDATED("Appointment Updated"),
    APPOINTMENT_CANCELLED("Appointment Cancelled"),
    APPOINTMENT_REMINDER("Appointment Reminder"),
    CASE_UPDATED("Case Updated"),
    MATCH_SELECTED("Match Selected"),
    PROVIDER_RESPONSE("Provider Response");

    private final String displayName;

    NotificationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
