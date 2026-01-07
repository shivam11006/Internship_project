package com.example.legalaid_backend.entity;

import com.example.legalaid_backend.util.AppointmentStatus;
import com.example.legalaid_backend.util.AppointmentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne
    @JoinColumn(name = "citizen_id", nullable = false)
    private User citizen;

    @ManyToOne
    @JoinColumn(name = "provider_id", nullable = false)
    private User provider;

    @ManyToOne
    @JoinColumn(name = "case_id", nullable = false)
    private Case legalCase;

    @Column(nullable = false)
    private LocalDateTime scheduledDateTime;

    @Column
    private LocalTime appointmentTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_type", length = 50)
    private AppointmentType appointmentType = AppointmentType.OFFLINE;

    @Column(length = 500)
    private String venue;

    @Column(length = 500)
    private String location;

    @Column(length = 500)
    private String address;

    // Legacy fields - kept for database compatibility (nullable)
    @Column(name = "duration_minutes")
    private Integer durationMinutes;


    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    @Column(length = 1000)
    private String notes;

    @Column(length = 500)
    private String agenda;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column
    private Boolean citizenConfirmed = false;

    @Column
    private Boolean providerConfirmed = false;

    @Column(length = 500)
    private String cancellationReason;

    @Column
    private LocalDateTime cancelledAt;

    @ManyToOne
    @JoinColumn(name = "cancelled_by_id")
    private User cancelledBy;

    @Column
    private LocalDateTime completedAt;

    @Column(length = 1000)
    private String completionNotes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
}
