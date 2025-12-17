package com.example.legalaid_backend.entity;

import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    // ⭐ Account enabled flag (for suspension)
    @Column(nullable = false)
    private boolean enabled = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // ================== PROFILES ==================

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private LawyerProfile lawyerProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private NgoProfile ngoProfile;

    // ================== CASE RELATIONSHIPS ==================

    // ⭐ Cases CREATED by this user (Citizen)
    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL)
    private List<Case> createdCases;

    // ⭐ Cases ASSIGNED to this user (Lawyer / NGO)
    @OneToMany(mappedBy = "assignedTo")
    private List<Case> assignedCases;
}
