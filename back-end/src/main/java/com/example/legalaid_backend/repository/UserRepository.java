package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.lawyerProfile LEFT JOIN FETCH u.ngoProfile WHERE u.email = :email")
    Optional<User> findByEmailWithProfiles(@Param("email") String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.lawyerProfile LEFT JOIN FETCH u.ngoProfile WHERE u.id = :id")
    Optional<User> findByIdWithProfiles(@Param("id") Long id);

    List<User> findByRoleAndApprovalStatusAndEnabled(
            Role role,
            ApprovalStatus approvalStatus,
            boolean enabled
    );
    
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Find users by role
    List<User> findByRole(Role role);
    long countByRole(Role role);

    // Find users by approval status
    List<User> findByApprovalStatus(ApprovalStatus status);
    long countByApprovalStatus(ApprovalStatus status);

    // Find users with multiple approval statuses
    // Useful for getting all pending approvals (PENDING + REAPPROVAL_PENDING)
    List<User> findByApprovalStatusIn(List<ApprovalStatus> statuses);

    // Find users by role and approval status
    List<User> findByRoleAndApprovalStatus(Role role, ApprovalStatus status);
    long countByRoleAndApprovalStatus(Role role, ApprovalStatus status);
}
