package com.example.legalaid_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lawyer_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LawyerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    // ⭐ CRUCIAL: Changes require re-approval
    private String barNumber;

    // ⭐ CRUCIAL: Changes require re-approval
    private String specialization;

    // ⭐ NEW: Track last approved values for crucial fields
    private String lastApprovedBarNumber;
    private String lastApprovedSpecialization;

    @Column(length = 500)
    private String address;
    
    @Column(length = 500)
    private String languages;
}
