package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.ChatHistoryDto;
import com.example.legalaid_backend.DTO.ChatListDto;
import com.example.legalaid_backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ChatRestController {
    private final ChatService chatService;

    /**
     * GET ALL CONVERSATIONS
     * GET /api/chats
     *
     * Returns list of all conversations (matches with chat enabled)
     * for the current user
     */
    @GetMapping
    public ResponseEntity<ChatListDto> getConversations(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/chats");

        try {
            log.info("User {} loading conversation list", auth.getName());

            ChatListDto conversations = chatService.getConversations();

            log.info("Returning {} conversations with {} total unread",
                    conversations.getTotalConversations(),
                    conversations.getTotalUnreadMessages());

            return ResponseEntity.ok(conversations);

        } catch (Exception e) {
            log.error("Failed to load conversations for {}: {}",
                    auth.getName(), e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET CHAT HISTORY
     * GET /api/chats/{matchId}/messages
     *
     * Returns paginated message history for a specific match
     * Use this when user opens a conversation
     */
    @GetMapping("/{matchId}/messages")
    public ResponseEntity<ChatHistoryDto> getChatHistory(
            @PathVariable Long matchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/chats/" + matchId + "/messages");

        try {
            log.info("User {} loading chat history: matchId={}, page={}",
                    auth.getName(), matchId, page);

            ChatHistoryDto history = chatService.getChatHistory(matchId, page, size);

            log.info("Returning {} messages for match {} (total: {}, unread: {})",
                    history.getMessages().size(), matchId,
                    history.getTotalMessages(), history.getUnreadCount());

            return ResponseEntity.ok(history);

        } catch (Exception e) {
            log.error("Failed to load chat history for match {}: {}",
                    matchId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * MARK MESSAGES AS READ
     * PUT /api/chats/{matchId}/read
     *
     * Marks all unread messages in a match as read
     * Call this when user opens/views a conversation
     */
    @PutMapping("/{matchId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long matchId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/chats/" + matchId + "/read");

        try {
            log.info("User {} marking messages as read: matchId={}",
                    auth.getName(), matchId);

            chatService.markMessagesAsRead(matchId);

            log.info("Messages marked as read for match {}", matchId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Messages marked as read");
            response.put("matchId", matchId.toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to mark messages as read for match {}: {}",
                    matchId, e.getMessage(), e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    /**
     * GET UNREAD COUNT FOR MATCH
     * GET /api/chats/{matchId}/unread
     *
     * Returns unread message count for a specific match
     */
    @GetMapping("/{matchId}/unread")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(
            @PathVariable Long matchId,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/chats/" + matchId + "/unread");

        try {
            int unreadCount = chatService.getUnreadCount(matchId);

            log.debug("Unread count for match {}: {}", matchId, unreadCount);

            Map<String, Integer> response = new HashMap<>();
            response.put("matchId", matchId.intValue());
            response.put("unreadCount", unreadCount);

            return ResponseEntity.ok(response);

        } finally {
            MDC.clear();
        }
    }

    /**
     * GET TOTAL UNREAD COUNT
     * GET /api/chats/unread/total
     *
     * Returns total unread count across all conversations
     * Use for notification badge
     */
    @GetMapping("/unread/total")
    public ResponseEntity<Map<String, Integer>> getTotalUnreadCount(Authentication auth) {
        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/chats/unread/total");

        try {
            int totalUnread = chatService.getTotalUnreadCount();

            log.debug("Total unread count for user {}: {}", auth.getName(), totalUnread);

            Map<String, Integer> response = new HashMap<>();
            response.put("totalUnread", totalUnread);

            return ResponseEntity.ok(response);

        } finally {
            MDC.clear();
        }
    }
}
