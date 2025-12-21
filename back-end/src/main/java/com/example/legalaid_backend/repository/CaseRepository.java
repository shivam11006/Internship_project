package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.Case;
import com.example.legalaid_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CaseRepository extends JpaRepository<Case, Long> {

    List<Case> findByCreatedBy(User user);

    Optional<Case> findByIdAndCreatedBy(Long id, User user);
}
