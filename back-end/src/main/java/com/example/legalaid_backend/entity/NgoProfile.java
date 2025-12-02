package com.example.legalaid_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ngo_profiles")
public class NgoProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ngoName;
    private String registrationNumber; // minimal sample field

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    public NgoProfile() {}

    public NgoProfile(String ngoName, String registrationNumber, User user) {
        this.ngoName = ngoName;
        this.registrationNumber = registrationNumber;
        this.user = user;
    }

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNgoName() { return ngoName; }
    public void setNgoName(String ngoName) { this.ngoName = ngoName; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
