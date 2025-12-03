package com.example.legalaid_backend.entity;

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

    // Minimal fields for now
    private String specialization;
    private int yearsOfExperience; // simple text field, adjust to int if needed

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
}
