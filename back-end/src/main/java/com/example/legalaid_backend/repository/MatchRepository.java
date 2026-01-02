package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.Match;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.util.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    // Find all matches for a specific case
    List<Match> findByLegalCaseId(Long caseId);

    // Find all matches for a lawyer
    List<Match> findByLawyer(User lawyer);

    // Find all matches for an NGO
    List<Match> findByNgo(User ngo);

    // Find matches by status for a lawyer
    List<Match> findByLawyerAndStatus(User lawyer, MatchStatus status);

    // Find matches by status for an NGO
    List<Match> findByNgoAndStatus(User ngo, MatchStatus status);

    // Find matches by case and status
    List<Match> findByLegalCaseIdAndStatus(Long caseId, MatchStatus status);

    // Check if a match already exists for a case and lawyer
    Optional<Match> findByLegalCaseIdAndLawyerId(Long caseId, Long lawyerId);

    // Check if a match already exists for a case and NGO
    Optional<Match> findByLegalCaseIdAndNgoId(Long caseId, Long ngoId);

    // Find all pending matches for a lawyer or NGO
    @Query("SELECT m FROM Match m WHERE (m.lawyer.id = :userId OR m.ngo.id = :userId) AND m.status = :status ORDER BY m.createdAt DESC")
    List<Match> findByProviderIdAndStatus(@Param("userId") Long userId, @Param("status") MatchStatus status);

    // Find all matches for a lawyer or NGO (any status)
    @Query("SELECT m FROM Match m WHERE (m.lawyer.id = :userId OR m.ngo.id = :userId) ORDER BY m.createdAt DESC")
    List<Match> findByProviderId(@Param("userId") Long userId);
}
