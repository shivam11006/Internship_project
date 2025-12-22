package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.ApplicationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ApplicationLogRepository extends JpaRepository<ApplicationLog, Long> {

    // Find logs by level (INFO, ERROR, WARN, etc.)
    Page<ApplicationLog> findByLevel(String level, Pageable pageable);

    // Find logs by date range
    Page<ApplicationLog> findByTimestampBetween(
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable
    );

    // Find logs by level and date range
    Page<ApplicationLog> findByLevelAndTimestampBetween(
            String level,
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable
    );

    // Find logs by endpoint
    Page<ApplicationLog> findByEndpointContaining(String endpoint, Pageable pageable);

    // Find logs by username
    Page<ApplicationLog> findByUsernameContaining(String username, Pageable pageable);

    // Count logs by level
    @Query("SELECT COUNT(l) FROM ApplicationLog l WHERE l.level = :level")
    long countByLevel(String level);

    // Get recent error logs
    @Query("SELECT l FROM ApplicationLog l WHERE l.level = 'ERROR' ORDER BY l.timestamp DESC")
    List<ApplicationLog> findRecentErrors(Pageable pageable);
}
