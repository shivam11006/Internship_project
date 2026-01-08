package com.example.legalaid_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ngo_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"user"})
public class NgoProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;



    // CRUCIAL: Changes require re-approval
    private String organizationName;

    // CRUCIAL: Changes require re-approval
    private String registrationNumber;

    // CRUCIAL: Changes require re-approval
    private String focusArea;

    // ⭐ NEW: Track last approved values for crucial fields
    private String lastApprovedOrganizationName;
    private String lastApprovedRegistrationNumber;
    private String lastApprovedFocusArea;

    @Column(length = 500)
    private String address;
    
    @Column(length = 500)
    private String languages;

}
