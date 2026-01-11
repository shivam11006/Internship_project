package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.NotificationDTO;
import com.example.legalaid_backend.DTO.NotificationResponse;
import com.example.legalaid_backend.entity.Notification;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.NotificationRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Create and save a notification
     */
    @Transactional
    public Notification createNotification(User user, NotificationType type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification {} for user {}: {}", saved.getId(), user.getId(), title);
        return saved;
    }

    /**
     * Create notification with additional metadata
     */
    @Transactional
    public Notification createNotificationWithMetadata(User user, NotificationType type, String title, String message,
                                                       Long matchId, Long appointmentId, Long caseId,
                                                       Long chatMessageId, Long relatedUserId, String actionUrl) {
        Notification notification = createNotification(user, type, title, message);
        notification.setMatchId(matchId);
        notification.setAppointmentId(appointmentId);
        notification.setCaseId(caseId);
        notification.setChatMessageId(chatMessageId);
        notification.setRelatedUserId(relatedUserId);
        notification.setActionUrl(actionUrl);

        return notificationRepository.save(notification);
    }

    /**
     * Get all notifications for current user
     */
    public NotificationResponse getUserNotifications(int page, int size) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        
        var notificationsPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable);
        List<NotificationDTO> dtos = notificationsPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        long unreadCount = notificationRepository.countByUserIdAndReadFalse(currentUser.getId());

        NotificationResponse response = new NotificationResponse();
        response.setNotifications(dtos);
        response.setUnreadCount(unreadCount);
        response.setTotalCount((int) notificationsPage.getTotalElements());

        return response;
    }

    /**
     * Get unread notifications only
     */
    public NotificationResponse getUnreadNotifications() {
        User currentUser = getCurrentUser();
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndReadFalseOrderByCreatedAtDesc(currentUser.getId());

        List<NotificationDTO> dtos = unreadNotifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        NotificationResponse response = new NotificationResponse();
        response.setNotifications(dtos);
        response.setUnreadCount(dtos.size());
        response.setTotalCount(dtos.size());

        return response;
    }

    /**
     * Mark a specific notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        // Verify ownership
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized: Cannot mark other user's notification as read");
        }

        notificationRepository.markAsRead(notificationId);
        log.info("Marked notification {} as read", notificationId);
    }

    /**
     * Mark all notifications as read for current user
     */
    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationRepository.markAllAsRead(currentUser.getId());
        log.info("Marked all notifications as read for user {}", currentUser.getId());
    }

    /**
     * Delete a notification
     */
    @Transactional
    public void deleteNotification(Long notificationId) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        // Verify ownership
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized: Cannot delete other user's notification");
        }

        notificationRepository.deleteById(notificationId);
        log.info("Deleted notification {}", notificationId);
    }

    /**
     * Get unread count for current user
     */
    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.countByUserIdAndReadFalse(currentUser.getId());
    }

    /**
     * Notify multiple users
     */
    @Transactional
    public void notifyUsers(List<User> users, NotificationType type, String title, String message) {
        for (User user : users) {
            createNotification(user, type, title, message);
        }
        log.info("Notified {} users about {}", users.size(), type);
    }

    /**
     * Get notifications by type
     */
    public List<NotificationDTO> getNotificationsByType(NotificationType type) {
        User currentUser = getCurrentUser();
        List<Notification> notifications = notificationRepository
                .findByUserIdAndTypeOrderByCreatedAtDesc(currentUser.getId(), type);

        return notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Clean up old notifications (older than 30 days)
     */
    @Transactional
    public void deleteOldNotifications(Long userId) {
        notificationRepository.deleteOldNotifications(userId, 30);
        log.info("Deleted old notifications for user {}", userId);
    }

    /**
     * Convert entity to DTO
     */
    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setActionUrl(notification.getActionUrl());
        dto.setMatchId(notification.getMatchId());
        dto.setAppointmentId(notification.getAppointmentId());
        dto.setCaseId(notification.getCaseId());
        dto.setChatMessageId(notification.getChatMessageId());
        dto.setRelatedUserId(notification.getRelatedUserId());
        return dto;
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
