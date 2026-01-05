package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Get all messages for a match (for loading chat history)
     * Returns messages in chronological order
     */
    List<ChatMessage> findByMatchIdAndDeletedFalseOrderBySentAtAsc(Long matchId);

    /**
     * Get paginated messages for a match (newest first, for infinite scroll)
     */
    Page<ChatMessage> findByMatchIdAndDeletedFalseOrderBySentAtDesc(Long matchId, Pageable pageable);

    /**
     * Get the last message for a match (for chat list preview)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.match.id = :matchId " +
            "AND cm.deleted = false ORDER BY cm.sentAt DESC LIMIT 1")
    Optional<ChatMessage> findLastMessageByMatchId(@Param("matchId") Long matchId);

    // ==================== UNREAD MESSAGE QUERIES ====================

    /**
     * Get unread messages for a specific user in a match
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.match.id = :matchId " +
            "AND cm.sender.id != :userId AND cm.isRead = false AND cm.deleted = false " +
            "ORDER BY cm.sentAt ASC")
    List<ChatMessage> findUnreadMessagesByMatchIdAndUserId(
            @Param("matchId") Long matchId,
            @Param("userId") Long userId);

    /**
     * Count unread messages for a user in a specific match
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.match.id = :matchId " +
            "AND cm.sender.id != :userId AND cm.isRead = false AND cm.deleted = false")
    long countUnreadByMatchIdAndUserId(
            @Param("matchId") Long matchId,
            @Param("userId") Long userId);

    /**
     * Count total unread messages for a user across all their matches
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm " +
            "JOIN cm.match m WHERE " +
            "(m.legalCase.createdBy.id = :userId OR m.lawyer.id = :userId OR m.ngo.id = :userId) " +
            "AND cm.sender.id != :userId AND cm.isRead = false AND cm.deleted = false")
    long countTotalUnreadByUserId(@Param("userId") Long userId);

    // ==================== MARK AS READ ====================

    /**
     * Mark all messages in a match as read for a specific user
     */
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.isRead = true, cm.readAt = :readAt " +
            "WHERE cm.match.id = :matchId AND cm.sender.id != :userId " +
            "AND cm.isRead = false AND cm.deleted = false")
    int markMessagesAsRead(
            @Param("matchId") Long matchId,
            @Param("userId") Long userId,
            @Param("readAt") LocalDateTime readAt);

    // ==================== STATISTICS ====================

    /**
     * Count total messages in a match
     */
    long countByMatchIdAndDeletedFalse(Long matchId);

    /**
     * Get message count per match for a user
     */
    @Query("SELECT cm.match.id, COUNT(cm) FROM ChatMessage cm " +
            "JOIN cm.match m WHERE " +
            "(m.legalCase.createdBy.id = :userId OR m.lawyer.id = :userId OR m.ngo.id = :userId) " +
            "AND cm.deleted = false GROUP BY cm.match.id")
    List<Object[]> getMessageCountsByUserId(@Param("userId") Long userId);

    // ==================== SOFT DELETE ====================

    /**
     * Soft delete a message
     */
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.deleted = true WHERE cm.id = :messageId")
    int softDeleteMessage(@Param("messageId") Long messageId);

    /**
     * Soft delete all messages in a match
     */
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.deleted = true WHERE cm.match.id = :matchId")
    int softDeleteAllByMatchId(@Param("matchId") Long matchId);
}
