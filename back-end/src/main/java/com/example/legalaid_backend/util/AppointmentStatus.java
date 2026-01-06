package com.example.legalaid_backend.util;

public enum AppointmentStatus {
    PENDING_CITIZEN_APPROVAL,   // Created by provider, waiting for citizen to accept
    PENDING_PROVIDER_APPROVAL,  // Created by citizen, waiting for provider to accept
    SCHEDULED,                  // Appointment has been scheduled, pending confirmation
    CONFIRMED,                  // Both parties have confirmed the appointment
    CANCELLED,                  // Appointment was cancelled
    COMPLETED,                  // Appointment was completed successfully
    NO_SHOW,                    // One or both parties did not show up
    RESCHEDULED,                // Appointment was rescheduled
    RESCHEDULE_REQUESTED        // One party has requested a reschedule
}
