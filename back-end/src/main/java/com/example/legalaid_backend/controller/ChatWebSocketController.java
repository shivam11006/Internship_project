package com.example.legalaid_backend.controller;


import com.example.legalaid_backend.DTO.ChatErrorDto;
import com.example.legalaid_backend.DTO.ChatMessageDto;
import com.example.legalaid_backend.DTO.SendChatMessageRequest;
import com.example.legalaid_backend.DTO.TypingIndicatorDto;
import com.example.legalaid_backend.entity.Match;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.MatchRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.service.ChatService;
import com.example.legalaid_backend.util.ChatUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    /**
     * Handle incoming chat messages
     *
     * Client sends to: /app/chat.send
     * Server sends to recipient: /user/{recipientEmail}/queue/messages
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendChatMessageRequest request, Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Get authenticated user - try Principal first, then fall back to SecurityContextHolder
            String userEmail = null;
            
            if (principal != null) {
                userEmail = principal.getName();
                log.info("WebSocket message received (from Principal): user={}, matchId={}", userEmail, request.getMatchId());
            } else if (headerAccessor != null && headerAccessor.getUser() != null) {
                userEmail = headerAccessor.getUser().getName();
                log.info("WebSocket message received (from header): user={}, matchId={}", userEmail, request.getMatchId());
            } else {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    userEmail = auth.getName();
                    log.info("WebSocket message received (from SecurityContext): user={}, matchId={}", userEmail, request.getMatchId());
                } else {
                    log.error("No authenticated user found in WebSocket message");
                    throw new RuntimeException("Authentication required for chat");
                }
            }

            // Get sender using email
            User sender = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Sender not found"));

            // Get match and validate sender is a participant
            Match match = matchRepository.findById(request.getMatchId())
                    .orElseThrow(() -> new RuntimeException("Match not found"));

            // Process message through service (includes validation)
            ChatMessageDto messageDto = chatService.sendMessage(request, sender.getId());

            // Get recipient (the other participant)
            User recipient = ChatUtils.getOtherParticipant(match, sender.getId());

            log.info("Delivering message: match={}, sender={}, recipient={}",
                    request.getMatchId(), sender.getEmail(), recipient.getEmail());

            // IMPORTANT: Use recipient's email (Principal name) for WebSocket delivery
            // This matches the authenticated principal in the WebSocket session
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/messages",
                    messageDto
            );

            // Send confirmation back to sender using their email
            messagingTemplate.convertAndSendToUser(
                    sender.getEmail(),
                    "/queue/messages",
                    messageDto
            );

            log.info("Message delivered successfully: id={}", messageDto.getId());

        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);

            // Send error to sender using their email (Principal name)
            ChatErrorDto error = ChatErrorDto.builder()
                    .error("MESSAGE_SEND_FAILED")
                    .message(e.getMessage())
                    .matchId(request.getMatchId())
                    .timestamp(LocalDateTime.now())
                    .build();

            try {
                String userEmail = null;
                if (principal != null) {
                    userEmail = principal.getName();
                } else if (headerAccessor != null && headerAccessor.getUser() != null) {
                    userEmail = headerAccessor.getUser().getName();
                } else {
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.isAuthenticated()) {
                        userEmail = auth.getName();
                    }
                }
                
                if (userEmail != null) {
                    User sender = userRepository.findByEmail(userEmail).orElse(null);
                    if (sender != null) {
                        messagingTemplate.convertAndSendToUser(
                                sender.getEmail(),
                                "/queue/errors",
                                error
                        );
                    }
                }
            } catch (Exception errorEx) {
                log.error("Failed to send error message: {}", errorEx.getMessage());
            }
        }
    }

    /**
     * Handle typing indicators
     *
     * Client sends to: /app/chat.typing
     * Server forwards to recipient: /user/{recipientEmail}/queue/typing
     */
    @MessageMapping("/chat.typing")
    public void handleTypingIndicator(@Payload TypingIndicatorDto indicator, Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Get authenticated user - try Principal first, then fall back to SecurityContextHolder
            String userEmail = null;
            
            if (principal != null) {
                userEmail = principal.getName();
            } else if (headerAccessor != null && headerAccessor.getUser() != null) {
                userEmail = headerAccessor.getUser().getName();
            } else {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    userEmail = auth.getName();
                }
            }
            
            if (userEmail == null) {
                log.warn("Typing indicator received with no authenticated user");
                return;
            }

            log.debug("Typing indicator: user={}, matchId={}, isTyping={}",
                    userEmail, indicator.getMatchId(), indicator.isTyping());

            // Get match
            Match match = matchRepository.findById(indicator.getMatchId())
                    .orElseThrow(() -> new RuntimeException("Match not found"));

            // Get sender
            User sender = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Validate sender is participant
            if (!ChatUtils.isParticipant(match, sender.getId())) {
                return; // Silently ignore
            }

            // Get recipient
            User recipient = ChatUtils.getOtherParticipant(match, sender.getId());

            // Update indicator with sender info
            indicator.setUserId(sender.getId());
            indicator.setUserName(sender.getUsername());

            // Send to recipient only using their email (Principal name)
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/typing",
                    indicator
            );

        } catch (Exception e) {
            log.debug("Error handling typing indicator: {}", e.getMessage());
            // Don't propagate errors for typing indicators
        }
    }

    /**
     * Handle connection events (optional - for online status)
     */
    @MessageMapping("/chat.connect")
    public void handleConnect(Principal principal) {
        try {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            log.info("User connected to chat: id={}, name={}",
                    user.getId(), user.getUsername());

            // TODO: Update online status
            // TODO: Notify other users in active conversations

        } catch (Exception e) {
            log.error("Error handling connect: {}", e.getMessage());
        }
    }

    /**
     * Handle disconnection events (optional)
     */
    @MessageMapping("/chat.disconnect")
    public void handleDisconnect(Principal principal) {
        try {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            log.info("User disconnected from chat: id={}, name={}",
                    user.getId(), user.getUsername());

            // TODO: Update offline status

        } catch (Exception e) {
            log.error("Error handling disconnect: {}", e.getMessage());
        }
    }
}
