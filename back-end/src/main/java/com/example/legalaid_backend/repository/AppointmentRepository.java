package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.Appointment;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.util.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Find appointments by citizen
    List<Appointment> findByCitizenOrderByScheduledDateTimeDesc(User citizen);

    // Find appointments by provider (lawyer or NGO)
    List<Appointment> findByProviderOrderByScheduledDateTimeDesc(User provider);

    // Find appointments by case
    List<Appointment> findByLegalCaseIdOrderByScheduledDateTimeDesc(Long caseId);

    // Find appointments by match
    List<Appointment> findByMatchIdOrderByScheduledDateTimeDesc(Long matchId);

    // Find appointments by status
    List<Appointment> findByStatusOrderByScheduledDateTimeDesc(AppointmentStatus status);

    // Find appointments pending citizen approval for a specific citizen (using derived query)
    List<Appointment> findByCitizenAndStatusOrderByScheduledDateTimeAsc(User citizen, AppointmentStatus status);

    // Find appointments pending provider approval for a specific provider (using derived query)
    List<Appointment> findByProviderAndStatusOrderByScheduledDateTimeAsc(User provider, AppointmentStatus status);

    // Find appointments with reschedule requests for a user
    @Query("SELECT a FROM Appointment a WHERE (a.citizen = :user OR a.provider = :user) " +
           "AND a.status = :status ORDER BY a.scheduledDateTime ASC")
    List<Appointment> findByUserAndStatus(@Param("user") User user, @Param("status") AppointmentStatus status);

    // Find upcoming appointments for a user (citizen or provider)
    @Query("SELECT a FROM Appointment a WHERE (a.citizen = :user OR a.provider = :user) " +
           "AND a.scheduledDateTime > :now AND a.status IN :statuses " +
           "ORDER BY a.scheduledDateTime ASC")
    List<Appointment> findUpcomingAppointments(
            @Param("user") User user,
            @Param("now") LocalDateTime now,
            @Param("statuses") List<AppointmentStatus> statuses);

    // Find past appointments for a user
    @Query("SELECT a FROM Appointment a WHERE (a.citizen = :user OR a.provider = :user) " +
           "AND a.scheduledDateTime < :now ORDER BY a.scheduledDateTime DESC")
    List<Appointment> findPastAppointments(
            @Param("user") User user,
            @Param("now") LocalDateTime now);

    // Find appointments in a date range for a user
    @Query("SELECT a FROM Appointment a WHERE (a.citizen = :user OR a.provider = :user) " +
           "AND a.scheduledDateTime BETWEEN :start AND :end ORDER BY a.scheduledDateTime ASC")
    List<Appointment> findAppointmentsInRange(
            @Param("user") User user,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // Check for conflicting appointments (overlap check without date arithmetic)
    // We check if the new appointment overlaps with existing ones
    // An overlap occurs when: existing start < new end AND new start < existing end + duration
    // Since JPQL doesn't support date arithmetic, we use a simpler approach
    @Query("SELECT a FROM Appointment a WHERE a.provider = :provider " +
           "AND a.status IN :statuses " +
           "AND a.scheduledDateTime < :endTime " +
           "AND a.scheduledDateTime >= :checkStartTime")
    List<Appointment> findConflictingAppointments(
            @Param("provider") User provider,
            @Param("checkStartTime") LocalDateTime checkStartTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") List<AppointmentStatus> statuses);

    // Count appointments by status for a user
    @Query("SELECT COUNT(a) FROM Appointment a WHERE (a.citizen = :user OR a.provider = :user) " +
           "AND a.status = :status")
    Long countByUserAndStatus(@Param("user") User user, @Param("status") AppointmentStatus status);

    // Find all appointments for a user (citizen or provider)
    @Query("SELECT a FROM Appointment a WHERE a.citizen = :user OR a.provider = :user " +
           "ORDER BY a.scheduledDateTime DESC")
    List<Appointment> findAllByUser(@Param("user") User user);
}
