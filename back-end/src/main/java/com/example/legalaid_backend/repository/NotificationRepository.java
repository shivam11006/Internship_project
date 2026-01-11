package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.Notification;
import com.example.legalaid_backend.util.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find all notifications for a user ordered by creation time (newest first)
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find paginated notifications for a user
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Count unread notifications for a user
     */
    long countByUserIdAndReadFalse(Long userId);

    /**
     * Find notifications by type for a user
     */
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type);

    /**
     * Find notification by match ID
     */
    List<Notification> findByMatchIdOrderByCreatedAtDesc(Long matchId);

    /**
     * Find notification by appointment ID
     */
    List<Notification> findByAppointmentIdOrderByCreatedAtDesc(Long appointmentId);

    /**
     * Find notification by chat message ID
     */
    Optional<Notification> findByChatMessageId(Long chatMessageId);

    /**
     * Mark a notification as read
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id")
    void markAsRead(@Param("id") Long id);

    /**
     * Mark all notifications for a user as read
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId")
    void markAllAsRead(@Param("userId") Long userId);

    /**
     * Delete old notifications (older than X days)
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM notifications WHERE user_id = :userId AND created_at < CURRENT_TIMESTAMP - INTERVAL ':days days'", nativeQuery = true)
    void deleteOldNotifications(@Param("userId") Long userId, @Param("days") int days);

    /**
     * Find notifications by case ID
     */
    List<Notification> findByCaseIdOrderByCreatedAtDesc(Long caseId);
}
