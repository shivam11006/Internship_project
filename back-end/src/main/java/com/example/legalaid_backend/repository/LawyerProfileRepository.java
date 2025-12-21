package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.LawyerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LawyerProfileRepository extends JpaRepository<LawyerProfile, Long> {
    Optional<LawyerProfile> findByUserId(Long id);
}
