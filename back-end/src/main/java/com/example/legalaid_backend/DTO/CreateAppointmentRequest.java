package com.example.legalaid_backend.DTO;

import com.example.legalaid_backend.util.AppointmentType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {
    private Long matchId;
    private Long caseId;
    private LocalDateTime scheduledDateTime;
    private LocalTime appointmentTime;
    private AppointmentType appointmentType; // CALL or OFFLINE
    private String venue;
    private String location;
    private String address;
    private String meetingLink; // phone number or meeting link
    private Integer durationMinutes;
    private String notes;
    private String agenda;
}
