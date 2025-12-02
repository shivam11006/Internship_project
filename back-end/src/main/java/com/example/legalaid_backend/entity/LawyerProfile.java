package com.example.legalaid_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "lawyer_profiles")
public class LawyerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Minimal fields for now
    private String specialization;
    private String yearsOfExperience; // simple text field, adjust to int if needed

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    public LawyerProfile() {}

    public LawyerProfile(String specialization, String yearsOfExperience, User user) {
        this.specialization = specialization;
        this.yearsOfExperience = yearsOfExperience;
        this.user = user;
    }

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(String yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
