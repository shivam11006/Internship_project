package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.NotificationDTO;
import com.example.legalaid_backend.DTO.NotificationResponse;
import com.example.legalaid_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications
     * Get all notifications for the current user with pagination
     */
    @GetMapping
    public ResponseEntity<NotificationResponse> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        log.info("User {} fetching notifications", auth.getName());
        NotificationResponse response = notificationService.getUserNotifications(page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/notifications/unread
     * Get only unread notifications for the current user
     */
    @GetMapping("/unread")
    public ResponseEntity<NotificationResponse> getUnreadNotifications(Authentication auth) {
        log.info("User {} fetching unread notifications", auth.getName());
        NotificationResponse response = notificationService.getUnreadNotifications();
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/notifications/unread-count
     * Get count of unread notifications
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        log.info("User {} fetching unread count", auth.getName());
        long unreadCount = notificationService.getUnreadCount();
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", unreadCount);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/notifications/{id}/read
     * Mark a specific notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long id,
            Authentication auth) {

        log.info("User {} marking notification {} as read", auth.getName(), id);

        try {
            notificationService.markAsRead(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification marked as read");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error marking notification as read: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/notifications/mark-all-read
     * Mark all notifications as read
     */
    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication auth) {
        log.info("User {} marking all notifications as read", auth.getName());

        try {
            notificationService.markAllAsRead();
            Map<String, String> response = new HashMap<>();
            response.put("message", "All notifications marked as read");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error marking all notifications as read: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/notifications/{id}
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @PathVariable Long id,
            Authentication auth) {

        log.info("User {} deleting notification {}", auth.getName(), id);

        try {
            notificationService.deleteNotification(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error deleting notification: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
