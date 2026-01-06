package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * CREATE APPOINTMENT (ALL AUTHENTICATED USERS)
     * POST /api/appointments
     * Lawyers/NGOs can create appointments for citizens (citizen needs to accept)
     * Citizens can create appointments for lawyers/NGOs (provider needs to accept)
     */
    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @RequestBody CreateAppointmentRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments");

        try {
            log.info("Appointment creation request from user: {}, matchId: {}", 
                    auth.getName(), request.getMatchId());

            AppointmentResponse response = appointmentService.createAppointment(request);

            log.info("Appointment created successfully: ID {}", response.getId());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to create appointment for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET MY APPOINTMENTS
     * GET /api/appointments/my
     */
    @GetMapping("/my")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/my");

        try {
            log.info("User {} requested their appointments", auth.getName());

            List<AppointmentResponse> appointments = appointmentService.getMyAppointments();

            log.info("Retrieved {} appointments for user {}", appointments.size(), auth.getName());

            return ResponseEntity.ok(appointments);

        } catch (Exception e) {
            log.error("Failed to retrieve appointments for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET UPCOMING APPOINTMENTS
     * GET /api/appointments/upcoming
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<AppointmentResponse>> getUpcomingAppointments(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/upcoming");

        try {
            log.info("User {} requested upcoming appointments", auth.getName());

            List<AppointmentResponse> appointments = appointmentService.getUpcomingAppointments();

            log.info("Retrieved {} upcoming appointments for user {}", appointments.size(), auth.getName());

            return ResponseEntity.ok(appointments);

        } catch (Exception e) {
            log.error("Failed to retrieve upcoming appointments for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET PAST APPOINTMENTS
     * GET /api/appointments/past
     */
    @GetMapping("/past")
    public ResponseEntity<List<AppointmentResponse>> getPastAppointments(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/past");

        try {
            log.info("User {} requested past appointments", auth.getName());

            List<AppointmentResponse> appointments = appointmentService.getPastAppointments();

            log.info("Retrieved {} past appointments for user {}", appointments.size(), auth.getName());

            return ResponseEntity.ok(appointments);

        } catch (Exception e) {
            log.error("Failed to retrieve past appointments for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET PENDING APPOINTMENTS (requiring my action)
     * GET /api/appointments/pending
     * Returns appointments that need the current user to accept/respond
     */
    @GetMapping("/pending")
    public ResponseEntity<List<AppointmentResponse>> getPendingAppointments(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/pending");

        try {
            log.info("User {} requested pending appointments", auth.getName());

            List<AppointmentResponse> appointments = appointmentService.getPendingAppointments();

            log.info("Retrieved {} pending appointments for user {}", appointments.size(), auth.getName());

            return ResponseEntity.ok(appointments);

        } catch (Exception e) {
            log.error("Failed to retrieve pending appointments for user {}: {}", auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET APPOINTMENT BY ID
     * GET /api/appointments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(
            @PathVariable Long id,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/" + id);

        try {
            log.info("User {} requested appointment ID {}", auth.getName(), id);

            AppointmentResponse response = appointmentService.getAppointmentById(id);

            log.info("Retrieved appointment ID {} for user {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to retrieve appointment {} for user {}: {}", id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET APPOINTMENTS BY CASE
     * GET /api/appointments/case/{caseId}
     */
    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByCase(
            @PathVariable Long caseId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/case/" + caseId);

        try {
            log.info("User {} requested appointments for case {}", auth.getName(), caseId);

            List<AppointmentResponse> appointments = appointmentService.getAppointmentsByCase(caseId);

            log.info("Retrieved {} appointments for case {} for user {}", 
                    appointments.size(), caseId, auth.getName());

            return ResponseEntity.ok(appointments);

        } catch (Exception e) {
            log.error("Failed to retrieve appointments for case {} for user {}: {}", 
                    caseId, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * UPDATE APPOINTMENT
     * PUT /api/appointments/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long id,
            @RequestBody UpdateAppointmentRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/" + id);

        try {
            log.info("User {} updating appointment ID {}", auth.getName(), id);

            AppointmentResponse response = appointmentService.updateAppointment(id, request);

            log.info("Appointment {} updated successfully by user {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to update appointment {} for user {}: {}", id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * CONFIRM/ACCEPT APPOINTMENT (CITIZEN ONLY - for provider-created appointments)
     * POST /api/appointments/{id}/confirm
     * Citizens accept the appointment proposed by lawyer/NGO
     */
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<AppointmentResponse> confirmAppointment(
            @PathVariable Long id,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/" + id + "/confirm");

        try {
            log.info("Citizen {} accepting appointment ID {}", auth.getName(), id);

            AppointmentResponse response = appointmentService.confirmAppointment(id);

            log.info("Appointment {} accepted by citizen {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to accept appointment {} for citizen {}: {}", id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * ACCEPT APPOINTMENT (LAWYER/NGO ONLY - for citizen-created appointments)
     * POST /api/appointments/{id}/accept
     * Lawyers/NGOs accept the appointment proposed by citizen
     */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('LAWYER', 'NGO')")
    public ResponseEntity<AppointmentResponse> acceptAppointment(
            @PathVariable Long id,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/" + id + "/accept");

        try {
            log.info("Provider {} accepting appointment ID {}", auth.getName(), id);

            AppointmentResponse response = appointmentService.acceptAppointmentByProvider(id);

            log.info("Appointment {} accepted by provider {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to accept appointment {} for provider {}: {}", id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * REQUEST RESCHEDULE (ALL USERS)
     * POST /api/appointments/{id}/request-reschedule
     * Both citizens and providers can request a different time for the appointment
     */
    @PostMapping("/{id}/request-reschedule")
    public ResponseEntity<AppointmentResponse> requestReschedule(
            @PathVariable Long id,
            @RequestBody RescheduleRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/" + id + "/request-reschedule");

        try {
            log.info("User {} requesting reschedule for appointment ID {}", auth.getName(), id);

            AppointmentResponse response = appointmentService.requestReschedule(id, request);

            log.info("Reschedule requested for appointment {} by user {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to request reschedule for appointment {} for user {}: {}", id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * CANCEL APPOINTMENT
     * POST /api/appointments/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            @RequestBody CancelAppointmentRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/" + id + "/cancel");

        try {
            log.info("User {} cancelling appointment ID {}", auth.getName(), id);

            AppointmentResponse response = appointmentService.cancelAppointment(id, request);

            log.info("Appointment {} cancelled by user {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to cancel appointment {} for user {}: {}", id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * COMPLETE APPOINTMENT
     * POST /api/appointments/{id}/complete
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable Long id,
            @RequestBody(required = false) CompleteAppointmentRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/" + id + "/complete");

        try {
            log.info("User {} completing appointment ID {}", auth.getName(), id);

            AppointmentResponse response = appointmentService.completeAppointment(id, request);

            log.info("Appointment {} completed by user {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to complete appointment {} for user {}: {}", id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * MARK NO SHOW
     * POST /api/appointments/{id}/no-show
     */
    @PostMapping("/{id}/no-show")
    public ResponseEntity<AppointmentResponse> markNoShow(
            @PathVariable Long id,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/appointments/" + id + "/no-show");

        try {
            log.info("User {} marking appointment ID {} as no-show", auth.getName(), id);

            AppointmentResponse response = appointmentService.markNoShow(id);

            log.info("Appointment {} marked as no-show by user {}", id, auth.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to mark appointment {} as no-show for user {}: {}", 
                    id, auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

}
