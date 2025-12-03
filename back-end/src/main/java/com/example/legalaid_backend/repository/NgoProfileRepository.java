package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.NgoProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NgoProfileRepository extends JpaRepository<NgoProfile,Long> {
    Optional<NgoProfile> findByUserId(Long id);
}
