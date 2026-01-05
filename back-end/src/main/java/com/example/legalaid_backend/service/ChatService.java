package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.*;
import com.example.legalaid_backend.entity.ChatMessage;
import com.example.legalaid_backend.entity.Match;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.ChatMessageRepository;
import com.example.legalaid_backend.repository.MatchRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.ChatUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    // ==================== SEND MESSAGE ====================

    /**
     * Send a chat message (called from WebSocket controller)
     */
    @Transactional
    public ChatMessageDto sendMessage(SendChatMessageRequest request, Long senderId) {
        log.info("Sending message: matchId={}, senderId={}", request.getMatchId(), senderId);

        // Validate message content
        ChatUtils.validateMessageContent(request.getContent());

        // Get and validate match
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // Security: Check if sender is participant
        if (!ChatUtils.isParticipant(match, senderId)) {
            log.error("User {} is not participant in match {}", senderId, request.getMatchId());
            throw new RuntimeException("You are not part of this conversation");
        }

        // Check if chat is allowed for this match status
        if (!ChatUtils.canChat(match)) {
            log.error("Chat not allowed for match {} with status {}",
                    request.getMatchId(), match.getStatus());
            throw new RuntimeException("Chat is not available for this match status: " + match.getStatus());
        }

        // Get sender user
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        // Create and save message
        ChatMessage message = new ChatMessage();
        message.setMatch(match);
        message.setSender(sender);
        message.setContent(request.getContent().trim());
        message.setMessageType(request.getMessageType());
        message.setRead(false);
        message.setDeleted(false);

        ChatMessage savedMessage = chatMessageRepository.save(message);

        log.info("Message saved: id={}, matchId={}, sender={}",
                savedMessage.getId(), request.getMatchId(), sender.getUsername());

        return convertToDto(savedMessage, senderId);
    }

    // ==================== GET CHAT HISTORY ====================

    /**
     * Get chat history for a match with pagination
     */
    public ChatHistoryDto getChatHistory(Long matchId, int page, int size) {
        User currentUser = getCurrentUser();
        log.info("Loading chat history: matchId={}, userId={}, page={}",
                matchId, currentUser.getId(), page);

        // Get and validate match
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // Security check
        if (!ChatUtils.isParticipant(match, currentUser.getId())) {
            log.error("User {} attempted to access match {} without permission",
                    currentUser.getId(), matchId);
            throw new RuntimeException("Access denied: You are not part of this conversation");
        }

        // Get paginated messages (newest first for loading older messages)
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("sentAt").descending());
        Page<ChatMessage> messagePage = chatMessageRepository
                .findByMatchIdAndDeletedFalseOrderBySentAtDesc(matchId, pageRequest);

        // Convert to DTOs
        List<ChatMessageDto> messages = messagePage.getContent().stream()
                .map(msg -> convertToDto(msg, currentUser.getId()))
                .collect(Collectors.toList());

        // Reverse to show oldest first (chronological order)
        java.util.Collections.reverse(messages);

        // Get unread count
        long unreadCount = chatMessageRepository.countUnreadByMatchIdAndUserId(
                matchId, currentUser.getId());

        return ChatHistoryDto.builder()
                .matchId(matchId)
                .messages(messages)
                .totalMessages((int) messagePage.getTotalElements())
                .unreadCount((int) unreadCount)
                .hasMore(messagePage.hasNext())
                .currentPage(page)
                .build();
    }

    // ==================== GET CONVERSATION LIST ====================

    /**
     * Get list of all conversations for current user
     */
    public ChatListDto getConversations() {
        User currentUser = getCurrentUser();
        log.info("Loading conversations for user: {}", currentUser.getId());

        // Get all matches for user where chat is enabled
        List<Match> matches = matchRepository.findByProviderId(currentUser.getId());

        // Also get matches where user is the citizen
        List<Match> citizenMatches = matchRepository.findByLegalCaseId(null); // Need custom query
        // For now, we'll filter in code

        // Filter to only matches where chat is enabled
        List<ChatConversationDto> conversations = matches.stream()
                .filter(ChatUtils::canChat)
                .map(match -> convertToConversationDto(match, currentUser.getId()))
                .sorted(Comparator.comparing(ChatConversationDto::getLastMessageTime,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        // Get total unread count
        long totalUnread = chatMessageRepository.countTotalUnreadByUserId(currentUser.getId());

        return ChatListDto.builder()
                .conversations(conversations)
                .totalConversations(conversations.size())
                .totalUnreadMessages((int) totalUnread)
                .build();
    }

    // ==================== MARK AS READ ====================

    /**
     * Mark all messages in a match as read
     */
    @Transactional
    public void markMessagesAsRead(Long matchId) {
        User currentUser = getCurrentUser();
        log.info("Marking messages as read: matchId={}, userId={}", matchId, currentUser.getId());

        // Get and validate match
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // Security check
        if (!ChatUtils.isParticipant(match, currentUser.getId())) {
            throw new RuntimeException("Access denied");
        }

        // Mark messages as read
        int updatedCount = chatMessageRepository.markMessagesAsRead(
                matchId, currentUser.getId(), LocalDateTime.now());

        log.info("Marked {} messages as read for match {}", updatedCount, matchId);
    }

    // ==================== GET UNREAD COUNT ====================

    /**
     * Get unread message count for a specific match
     */
    public int getUnreadCount(Long matchId) {
        User currentUser = getCurrentUser();
        return (int) chatMessageRepository.countUnreadByMatchIdAndUserId(
                matchId, currentUser.getId());
    }

    /**
     * Get total unread count across all conversations
     */
    public int getTotalUnreadCount() {
        User currentUser = getCurrentUser();
        return (int) chatMessageRepository.countTotalUnreadByUserId(currentUser.getId());
    }

    // ==================== HELPER METHODS ====================

    /**
     * Convert ChatMessage entity to DTO
     */
    private ChatMessageDto convertToDto(ChatMessage message, Long currentUserId) {
        return ChatMessageDto.builder()
                .id(message.getId())
                .matchId(message.getMatch().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getUsername())
                .senderRole(message.getSender().getRole().name())
                .content(message.getContent())
                .messageType(message.getMessageType())
                .isRead(message.isRead())
                .isOwnMessage(message.getSender().getId().equals(currentUserId))
                .sentAt(message.getSentAt())
                .readAt(message.getReadAt())
                .editedAt(message.getEditedAt())
                .build();
    }

    /**
     * Convert Match to conversation DTO (for chat list)
     */
    private ChatConversationDto convertToConversationDto(Match match, Long currentUserId) {
        // Get other participant
        User otherUser = ChatUtils.getOtherParticipant(match, currentUserId);

        // Get last message
        ChatMessage lastMessage = chatMessageRepository
                .findLastMessageByMatchId(match.getId())
                .orElse(null);

        // Get unread count
        long unreadCount = chatMessageRepository.countUnreadByMatchIdAndUserId(
                match.getId(), currentUserId);

        return ChatConversationDto.builder()
                .matchId(match.getId())
                .caseId(match.getLegalCase().getId())
                .caseTitle(match.getLegalCase().getTitle())
                .caseType(match.getLegalCase().getCaseType())
                .matchStatus(match.getStatus().name())
                .otherUserId(otherUser.getId())
                .otherUserName(otherUser.getUsername())
                .otherUserRole(otherUser.getRole().name())
                .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageTime(lastMessage != null ? lastMessage.getSentAt() : null)
                .unreadCount((int) unreadCount)
                .canChat(ChatUtils.canChat(match))
                .createdAt(match.getCreatedAt())
                .build();
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
