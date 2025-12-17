package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.Case;
import com.example.legalaid_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseRepository extends JpaRepository<Case, Long> {

    // ⭐ Cases created by a citizen
    List<Case> findByCreatedBy(User user);

    // ⭐ Cases assigned to a lawyer or NGO
    List<Case> findByAssignedTo(User user);

    // ⭐ Filter cases by status (OPEN / ASSIGNED / CLOSED)
    List<Case> findByStatus(String status);
}
