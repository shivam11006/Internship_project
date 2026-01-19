package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.entity.Appointment;
import com.example.legalaid_backend.entity.Case;
import com.example.legalaid_backend.entity.Match;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.AppointmentRepository;
import com.example.legalaid_backend.repository.CaseRepository;
import com.example.legalaid_backend.repository.MatchRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.AppointmentStatus;
import com.example.legalaid_backend.util.AppointmentType;
import com.example.legalaid_backend.util.MatchStatus;
import com.example.legalaid_backend.util.NotificationType;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final MatchRepository matchRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // =========================
    // CREATE APPOINTMENT (ALL AUTHENTICATED USERS)
    // =========================
    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request) {
        User currentUser = getCurrentUser();

        log.info("Creating appointment by user: {}, matchId: {}", currentUser.getEmail(), request.getMatchId());

        // Validate match exists and is accepted
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (match.getStatus() != MatchStatus.ACCEPTED_BY_PROVIDER) {
            throw new RuntimeException("Cannot create appointment: Match must be accepted by provider");
        }

        Case legalCase = match.getLegalCase();
        User citizen = legalCase.getCreatedBy();
        User provider = match.getLawyer() != null ? match.getLawyer() : match.getNgo();

        if (provider == null) {
            throw new RuntimeException("No provider found for this match");
        }

        // Validate scheduled time is in the future
        if (request.getScheduledDateTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Scheduled time must be in the future");
        }

        // Set default appointment type if not provided
        AppointmentType appointmentType = request.getAppointmentType() != null 
            ? request.getAppointmentType() 
            : AppointmentType.OFFLINE;

        // Validate details based on appointment type
        if (appointmentType == AppointmentType.OFFLINE) {
            if (request.getVenue() == null || request.getVenue().trim().isEmpty()) {
                throw new RuntimeException("Venue is required for offline appointments");
            }
        } else if (appointmentType == AppointmentType.CALL) {
            if (request.getMeetingLink() == null || request.getMeetingLink().trim().isEmpty()) {
                throw new RuntimeException("Phone number or meeting link is required for call appointments");
            }
        }

        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setMatch(match);
        appointment.setLegalCase(legalCase);
        appointment.setCitizen(citizen);
        appointment.setProvider(provider);
        appointment.setScheduledDateTime(request.getScheduledDateTime());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setAppointmentType(appointmentType);
        appointment.setVenue(request.getVenue());
        appointment.setMeetingLink(request.getMeetingLink());
        appointment.setDurationMinutes(request.getDurationMinutes());
        appointment.setLocation(request.getLocation());
        appointment.setAddress(request.getAddress());
        appointment.setNotes(request.getNotes());
        appointment.setAgenda(request.getAgenda());
        appointment.setCreatedBy(currentUser);

        // Determine status and confirmations based on who created the appointment
        if (currentUser.getRole() == Role.LAWYER || currentUser.getRole() == Role.NGO) {
            // Provider creates appointment - verify they are the provider for this match
            if (!currentUser.getId().equals(provider.getId())) {
                throw new RuntimeException("Access denied: You are not the provider for this match");
            }
            // Provider auto-confirms, citizen needs to accept
            appointment.setProviderConfirmed(true);
            appointment.setCitizenConfirmed(false);
            appointment.setStatus(AppointmentStatus.PENDING_CITIZEN_APPROVAL);
            log.info("Appointment created by provider, awaiting citizen approval");
        } else if (currentUser.getRole() == Role.CITIZEN) {
            // Citizen creates appointment - verify they are the citizen for this case
            if (!currentUser.getId().equals(citizen.getId())) {
                throw new RuntimeException("Access denied: You are not the citizen for this case");
            }
            // Citizen auto-confirms, provider needs to accept
            appointment.setCitizenConfirmed(true);
            appointment.setProviderConfirmed(false);
            appointment.setStatus(AppointmentStatus.PENDING_PROVIDER_APPROVAL);
            log.info("Appointment created by citizen, awaiting provider approval");
        } else {
            throw new RuntimeException("Only citizens, lawyers, and NGOs can create appointments");
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment created successfully: ID {}, status: {}", savedAppointment.getId(), savedAppointment.getStatus());

        // Send notifications
        String appointmentTypeStr = appointmentType.toString();
        String dateTimeStr = savedAppointment.getScheduledDateTime().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm"));
        
        if (currentUser.getRole() == Role.LAWYER || currentUser.getRole() == Role.NGO) {
            // Notify citizen of new appointment request
            String title = "Appointment Scheduled";
            String message = "Your " + currentUser.getUsername() + " has scheduled an appointment on " + dateTimeStr;
            notificationService.createNotificationWithMetadata(
                    citizen, NotificationType.APPOINTMENT_SCHEDULED, title, message,
                    savedAppointment.getMatch().getId(), savedAppointment.getId(), legalCase.getId(), null, currentUser.getId(),
                    "/dashboard/my-appointments"
            );
        } else {
            // Notify provider of new appointment request
            String title = "Appointment Scheduled";
            String message = "A new appointment has been scheduled on " + dateTimeStr + ". Please review and confirm.";
            notificationService.createNotificationWithMetadata(
                    provider, NotificationType.APPOINTMENT_SCHEDULED, title, message,
                    savedAppointment.getMatch().getId(), savedAppointment.getId(), legalCase.getId(), null, currentUser.getId(),
                    "/dashboard/my-appointments"
            );
        }

        return toResponse(savedAppointment);
    }

    // =========================
    // GET APPOINTMENT BY ID
    // =========================
    public AppointmentResponse getAppointmentById(Long id) {
        User currentUser = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify access
        if (!hasAccessToAppointment(currentUser, appointment)) {
            throw new RuntimeException("Access denied");
        }

        return toResponse(appointment);
    }

    // =========================
    // GET MY APPOINTMENTS
    // =========================
    public List<AppointmentResponse> getMyAppointments() {
        User currentUser = getCurrentUser();

        log.info("Fetching appointments for user: {}", currentUser.getEmail());

        List<Appointment> appointments = appointmentRepository.findAllByUser(currentUser);

        return appointments.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // GET UPCOMING APPOINTMENTS
    // =========================
    public List<AppointmentResponse> getUpcomingAppointments() {
        User currentUser = getCurrentUser();

        List<AppointmentStatus> activeStatuses = Arrays.asList(
                AppointmentStatus.PENDING_CITIZEN_APPROVAL,
                AppointmentStatus.PENDING_PROVIDER_APPROVAL,
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.RESCHEDULE_REQUESTED,
                AppointmentStatus.RESCHEDULED
        );

        List<Appointment> appointments = appointmentRepository.findUpcomingAppointments(
                currentUser,
                LocalDateTime.now(),
                activeStatuses
        );

        return appointments.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // GET PAST APPOINTMENTS
    // =========================
    public List<AppointmentResponse> getPastAppointments() {
        User currentUser = getCurrentUser();

        List<Appointment> appointments = appointmentRepository.findPastAppointments(
                currentUser,
                LocalDateTime.now()
        );

        return appointments.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // GET PENDING APPOINTMENTS (requiring my action)
    // =========================
    public List<AppointmentResponse> getPendingAppointments() {
        User currentUser = getCurrentUser();

        List<Appointment> appointments = new ArrayList<>();
        
        if (currentUser.getRole() == Role.CITIZEN) {
            // Get appointments pending citizen approval
            appointments = appointmentRepository.findByCitizenAndStatusOrderByScheduledDateTimeAsc(
                    currentUser, AppointmentStatus.PENDING_CITIZEN_APPROVAL);
        } else if (currentUser.getRole() == Role.LAWYER || currentUser.getRole() == Role.NGO) {
            // Get appointments pending provider approval
            appointments = appointmentRepository.findByProviderAndStatusOrderByScheduledDateTimeAsc(
                    currentUser, AppointmentStatus.PENDING_PROVIDER_APPROVAL);
        } else {
            // Admins see all pending appointments
            appointments = appointmentRepository.findAll().stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.PENDING_CITIZEN_APPROVAL ||
                                a.getStatus() == AppointmentStatus.PENDING_PROVIDER_APPROVAL ||
                                a.getStatus() == AppointmentStatus.RESCHEDULE_REQUESTED)
                    .collect(Collectors.toList());
        }

        // Also add reschedule requests where user needs to respond
        List<Appointment> rescheduleRequests = appointmentRepository.findByUserAndStatus(
                currentUser, AppointmentStatus.RESCHEDULE_REQUESTED);
        rescheduleRequests.stream()
                .filter(a -> {
                    if (currentUser.getId().equals(a.getCitizen().getId()) && !Boolean.TRUE.equals(a.getCitizenConfirmed())) {
                        return true;  // Citizen needs to respond
                    }
                    if (currentUser.getId().equals(a.getProvider().getId()) && !Boolean.TRUE.equals(a.getProviderConfirmed())) {
                        return true;  // Provider needs to respond
                    }
                    return false;
                })
                .forEach(appointments::add);

        return appointments.stream()
                .distinct()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // GET APPOINTMENTS BY CASE
    // =========================
    public List<AppointmentResponse> getAppointmentsByCase(Long caseId) {
        User currentUser = getCurrentUser();

        // Verify case access
        Case legalCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        // Citizen can see appointments for their cases
        // Providers can see appointments for cases they're matched with
        if (!legalCase.getCreatedBy().getId().equals(currentUser.getId())) {
            // Check if user is a matched provider
            boolean isMatchedProvider = matchRepository.findByLegalCaseId(caseId)
                    .stream()
                    .anyMatch(m -> (m.getLawyer() != null && m.getLawyer().getId().equals(currentUser.getId())) ||
                                   (m.getNgo() != null && m.getNgo().getId().equals(currentUser.getId())));
            
            if (!isMatchedProvider && currentUser.getRole() != Role.ADMIN) {
                throw new RuntimeException("Access denied");
            }
        }

        List<Appointment> appointments = appointmentRepository.findByLegalCaseIdOrderByScheduledDateTimeDesc(caseId);

        return appointments.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // UPDATE APPOINTMENT
    // =========================
    @Transactional
    public AppointmentResponse updateAppointment(Long id, UpdateAppointmentRequest request) {
        User currentUser = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify access
        if (!hasAccessToAppointment(currentUser, appointment)) {
            throw new RuntimeException("Access denied");
        }

        // Cannot update completed or cancelled appointments
        if (appointment.getStatus() == AppointmentStatus.COMPLETED ||
            appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Cannot update completed or cancelled appointments");
        }

        boolean isCitizen = currentUser.getId().equals(appointment.getCitizen().getId());
        boolean isProvider = currentUser.getId().equals(appointment.getProvider().getId());

        // Update fields if provided
        if (request.getScheduledDateTime() != null) {
            if (request.getScheduledDateTime().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Scheduled time must be in the future");
            }
            appointment.setScheduledDateTime(request.getScheduledDateTime());
            // When time is changed, the person making the change confirms, other party needs to re-accept
            if (isCitizen) {
                appointment.setCitizenConfirmed(true);
                appointment.setProviderConfirmed(false);
                appointment.setStatus(AppointmentStatus.PENDING_PROVIDER_APPROVAL);
            } else if (isProvider) {
                appointment.setProviderConfirmed(true);
                appointment.setCitizenConfirmed(false);
                appointment.setStatus(AppointmentStatus.PENDING_CITIZEN_APPROVAL);
            }
        }

        if (request.getAppointmentTime() != null) {
            appointment.setAppointmentTime(request.getAppointmentTime());
        }

        if (request.getVenue() != null) {
            appointment.setVenue(request.getVenue());
        }

        if (request.getLocation() != null) {
            appointment.setLocation(request.getLocation());
        }

        if (request.getAddress() != null) {
            appointment.setAddress(request.getAddress());
        }

        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }

        if (request.getAgenda() != null) {
            appointment.setAgenda(request.getAgenda());
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment updated: ID {}, status: {}", savedAppointment.getId(), savedAppointment.getStatus());

        return toResponse(savedAppointment);
    }

    // =========================
    // CONFIRM/ACCEPT APPOINTMENT (CITIZEN ONLY)
    // =========================
    @Transactional
    public AppointmentResponse confirmAppointment(Long id) {
        User currentUser = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify citizen access only
        if (!currentUser.getId().equals(appointment.getCitizen().getId())) {
            throw new RuntimeException("Only citizens can accept appointments");
        }

        // Cannot confirm completed or cancelled appointments
        if (appointment.getStatus() == AppointmentStatus.COMPLETED ||
            appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Cannot confirm completed or cancelled appointments");
        }

        // Appointment must be pending citizen approval or rescheduled
        if (appointment.getStatus() != AppointmentStatus.PENDING_CITIZEN_APPROVAL &&
            appointment.getStatus() != AppointmentStatus.RESCHEDULE_REQUESTED &&
            appointment.getStatus() != AppointmentStatus.RESCHEDULED) {
            throw new RuntimeException("Appointment is not awaiting your approval");
        }

        // Citizen accepts the appointment
        appointment.setCitizenConfirmed(true);

        // Update status to confirmed if both parties have confirmed
        if (Boolean.TRUE.equals(appointment.getProviderConfirmed())) {
            appointment.setStatus(AppointmentStatus.CONFIRMED);
        } else {
            appointment.setStatus(AppointmentStatus.SCHEDULED);
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment ID {} created by provider {} is accepted by citizen {}. Status: {}", 
                savedAppointment.getId(), 
                savedAppointment.getProvider().getEmail(), 
                currentUser.getEmail(), 
                savedAppointment.getStatus());

        return toResponse(savedAppointment);
    }

    // =========================
    // ACCEPT APPOINTMENT (LAWYER/NGO ONLY - for citizen-created appointments)
    // =========================
    @Transactional
    public AppointmentResponse acceptAppointmentByProvider(Long id) {
        User currentUser = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify current user is a lawyer or NGO
        if (currentUser.getRole() != Role.LAWYER && currentUser.getRole() != Role.NGO) {
            throw new RuntimeException("Only lawyers and NGOs can accept appointments as providers");
        }

        // Verify provider access only
        if (!currentUser.getId().equals(appointment.getProvider().getId())) {
            throw new RuntimeException("You are not the provider for this appointment");
        }

        // Cannot confirm completed or cancelled appointments
        if (appointment.getStatus() == AppointmentStatus.COMPLETED ||
            appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Cannot accept completed or cancelled appointments");
        }

        // Appointment must be pending provider approval or rescheduled
        if (appointment.getStatus() != AppointmentStatus.PENDING_PROVIDER_APPROVAL &&
            appointment.getStatus() != AppointmentStatus.RESCHEDULE_REQUESTED &&
            appointment.getStatus() != AppointmentStatus.RESCHEDULED) {
            throw new RuntimeException("Appointment is not awaiting your approval");
        }

        // Provider accepts the appointment
        appointment.setProviderConfirmed(true);

        // Update status to confirmed if both parties have confirmed
        if (Boolean.TRUE.equals(appointment.getCitizenConfirmed())) {
            appointment.setStatus(AppointmentStatus.CONFIRMED);
        } else {
            appointment.setStatus(AppointmentStatus.SCHEDULED);
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment ID {} created by citizen {} is accepted by provider {}. Status: {}", 
                savedAppointment.getId(), 
                savedAppointment.getCitizen().getEmail(), 
                currentUser.getEmail(), 
                savedAppointment.getStatus());

        return toResponse(savedAppointment);
    }

    // =========================
    // REQUEST RESCHEDULE (ALL USERS - BOTH CITIZEN AND PROVIDER)
    // =========================
    @Transactional
    public AppointmentResponse requestReschedule(Long id, RescheduleRequest request) {
        User currentUser = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify user is either citizen or provider for this appointment
        boolean isCitizen = currentUser.getId().equals(appointment.getCitizen().getId());
        boolean isProvider = currentUser.getId().equals(appointment.getProvider().getId());
        
        if (!isCitizen && !isProvider) {
            throw new RuntimeException("Access denied: You are not part of this appointment");
        }

        // Cannot reschedule completed or cancelled appointments
        if (appointment.getStatus() == AppointmentStatus.COMPLETED ||
            appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Cannot reschedule completed or cancelled appointments");
        }

        // Update status to indicate reschedule requested
        appointment.setStatus(AppointmentStatus.RESCHEDULE_REQUESTED);
        
        // The person requesting reschedule confirms, the other party needs to respond
        if (isCitizen) {
            appointment.setCitizenConfirmed(true);
            appointment.setProviderConfirmed(false);  // Provider needs to respond
        } else {
            appointment.setProviderConfirmed(true);
            appointment.setCitizenConfirmed(false);  // Citizen needs to respond
        }
        
        // Add reschedule request details to notes
        String requesterRole = isCitizen ? "Citizen" : "Provider";
        String rescheduleNote = String.format(
            "\n\n--- RESCHEDULE REQUEST ---\nRequested by: %s (%s)\nPreferred time: %s\nReason: %s\nMessage: %s",
            currentUser.getUsername(),
            requesterRole,
            request.getPreferredDateTime() != null ? request.getPreferredDateTime().toString() : "Not specified",
            request.getReason() != null ? request.getReason() : "Not provided",
            request.getMessage() != null ? request.getMessage() : "No message"
        );
        
        String existingNotes = appointment.getNotes() != null ? appointment.getNotes() : "";
        appointment.setNotes(existingNotes + rescheduleNote);

        // If a preferred date time is provided, update the scheduled time
        if (request.getPreferredDateTime() != null) {
            if (request.getPreferredDateTime().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Preferred time must be in the future");
            }
            appointment.setScheduledDateTime(request.getPreferredDateTime());
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Reschedule requested by {} {}: ID {}", requesterRole, currentUser.getEmail(), savedAppointment.getId());

        // Notify the other party about the reschedule request
        User recipient = isCitizen ? appointment.getProvider() : appointment.getCitizen();
        String dateTimeStr = request.getPreferredDateTime() != null ? 
                request.getPreferredDateTime().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm")) : 
                "TBD";
        String title = "Appointment Reschedule Request";
        String message = currentUser.getUsername() + " has requested to reschedule the appointment to " + dateTimeStr;
        notificationService.createNotificationWithMetadata(
                recipient, NotificationType.APPOINTMENT_UPDATED, title, message,
                savedAppointment.getMatch().getId(), savedAppointment.getId(), savedAppointment.getLegalCase().getId(), null, currentUser.getId(),
                "/dashboard/my-appointments"
        );

        return toResponse(savedAppointment);
    }

    // =========================
    // CANCEL APPOINTMENT
    // =========================
    @Transactional
    public AppointmentResponse cancelAppointment(Long id, CancelAppointmentRequest request) {
        User currentUser = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify access
        if (!hasAccessToAppointment(currentUser, appointment)) {
            throw new RuntimeException("Access denied");
        }

        // Cannot cancel already completed or cancelled appointments
        if (appointment.getStatus() == AppointmentStatus.COMPLETED ||
            appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Appointment is already " + appointment.getStatus().name().toLowerCase());
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(request.getCancellationReason());
        appointment.setCancelledAt(LocalDateTime.now());
        appointment.setCancelledBy(currentUser);

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment cancelled by user {}: ID {}", currentUser.getEmail(), savedAppointment.getId());

        // Notify the other party about the cancellation
        User recipient = currentUser.getId().equals(appointment.getCitizen().getId()) ? 
                appointment.getProvider() : appointment.getCitizen();
        String title = "Appointment Cancelled";
        String message = currentUser.getUsername() + " has cancelled the appointment. Reason: " + 
                (request.getCancellationReason() != null ? request.getCancellationReason() : "No reason provided");
        notificationService.createNotificationWithMetadata(
                recipient, NotificationType.APPOINTMENT_CANCELLED, title, message,
                savedAppointment.getMatch().getId(), savedAppointment.getId(), savedAppointment.getLegalCase().getId(), null, currentUser.getId(),
                "/dashboard/my-appointments"
        );

        return toResponse(savedAppointment);
    }

    // =========================
    // COMPLETE APPOINTMENT
    // =========================
    @Transactional
    public AppointmentResponse completeAppointment(Long id, CompleteAppointmentRequest request) {
        User currentUser = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Only provider can complete appointments
        if (!currentUser.getId().equals(appointment.getProvider().getId()) && 
            currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only the provider can mark appointments as complete");
        }

        // Cannot complete cancelled appointments
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Cannot complete a cancelled appointment");
        }

        // Check if appointment time has passed
        if (appointment.getScheduledDateTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Cannot complete an appointment that hasn't started yet");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setCompletedAt(LocalDateTime.now());
        if (request != null && request.getCompletionNotes() != null) {
            appointment.setCompletionNotes(request.getCompletionNotes());
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment completed by user {}: ID {}", currentUser.getEmail(), savedAppointment.getId());

        return toResponse(savedAppointment);
    }

    // =========================
    // MARK NO SHOW
    // =========================
    @Transactional
    public AppointmentResponse markNoShow(Long id) {
        User currentUser = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Only provider or admin can mark no-show
        if (!currentUser.getId().equals(appointment.getProvider().getId()) && 
            currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only the provider can mark appointments as no-show");
        }

        // Check if appointment time has passed
        if (appointment.getScheduledDateTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Cannot mark no-show for an appointment that hasn't started yet");
        }

        appointment.setStatus(AppointmentStatus.NO_SHOW);

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment marked as no-show by user {}: ID {}", currentUser.getEmail(), savedAppointment.getId());

        return toResponse(savedAppointment);
    }

    // =========================
    // GET ALL APPOINTMENTS (ADMIN)
    // =========================
    public List<AppointmentResponse> getAllAppointments() {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: Admin only");
        }

        return appointmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // HELPER METHODS
    // =========================
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean hasAccessToAppointment(User user, Appointment appointment) {
        return user.getId().equals(appointment.getCitizen().getId()) ||
               user.getId().equals(appointment.getProvider().getId()) ||
               user.getRole() == Role.ADMIN;
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        // Determine action requirements based on status and confirmations
        Boolean actionRequiredByCitizen = false;
        Boolean actionRequiredByProvider = false;
        String statusDescription = "";

        switch (appointment.getStatus()) {
            case PENDING_CITIZEN_APPROVAL:
                actionRequiredByCitizen = true;
                statusDescription = "Awaiting citizen's approval";
                break;
            case PENDING_PROVIDER_APPROVAL:
                actionRequiredByProvider = true;
                statusDescription = "Awaiting provider's approval";
                break;
            case RESCHEDULE_REQUESTED:
                if (!Boolean.TRUE.equals(appointment.getCitizenConfirmed())) {
                    actionRequiredByCitizen = true;
                    statusDescription = "Reschedule requested - awaiting citizen's response";
                } else if (!Boolean.TRUE.equals(appointment.getProviderConfirmed())) {
                    actionRequiredByProvider = true;
                    statusDescription = "Reschedule requested - awaiting provider's response";
                }
                break;
            case SCHEDULED:
                statusDescription = "Scheduled - awaiting final confirmation";
                break;
            case CONFIRMED:
                statusDescription = "Confirmed by both parties";
                break;
            case COMPLETED:
                statusDescription = "Appointment completed";
                break;
            case CANCELLED:
                statusDescription = "Appointment cancelled";
                break;
            case NO_SHOW:
                statusDescription = "No-show";
                break;
            case RESCHEDULED:
                statusDescription = "Rescheduled - awaiting confirmation";
                if (!Boolean.TRUE.equals(appointment.getCitizenConfirmed())) {
                    actionRequiredByCitizen = true;
                }
                if (!Boolean.TRUE.equals(appointment.getProviderConfirmed())) {
                    actionRequiredByProvider = true;
                }
                break;
            default:
                statusDescription = appointment.getStatus().name();
        }

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .matchId(appointment.getMatch().getId())
                .caseId(appointment.getLegalCase().getId())
                .caseTitle(appointment.getLegalCase().getTitle())
                .caseType(appointment.getLegalCase().getCaseType())
                .citizenId(appointment.getCitizen().getId())
                .citizenName(appointment.getCitizen().getUsername())
                .citizenEmail(appointment.getCitizen().getEmail())
                .providerId(appointment.getProvider().getId())
                .providerName(appointment.getProvider().getUsername())
                .providerEmail(appointment.getProvider().getEmail())
                .providerRole(appointment.getProvider().getRole().name())
                .scheduledDateTime(appointment.getScheduledDateTime())
                .appointmentTime(appointment.getAppointmentTime())
                .appointmentType(appointment.getAppointmentType())
                .venue(appointment.getVenue())
                .meetingLink(appointment.getMeetingLink())
                .durationMinutes(appointment.getDurationMinutes())
                .location(appointment.getLocation())
                .address(appointment.getAddress())
                .notes(appointment.getNotes())
                .agenda(appointment.getAgenda())
                .status(appointment.getStatus())
                .citizenConfirmed(appointment.getCitizenConfirmed())
                .providerConfirmed(appointment.getProviderConfirmed())
                .actionRequiredByCitizen(actionRequiredByCitizen)
                .actionRequiredByProvider(actionRequiredByProvider)
                .statusDescription(statusDescription)
                .cancellationReason(appointment.getCancellationReason())
                .cancelledAt(appointment.getCancelledAt())
                .cancelledByName(appointment.getCancelledBy() != null ? 
                        appointment.getCancelledBy().getUsername() : null)
                .completedAt(appointment.getCompletedAt())
                .completionNotes(appointment.getCompletionNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .createdByName(appointment.getCreatedBy().getUsername())
                .build();
    }
}
