package com.example.legalaid_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private String caseType;

    @Column(nullable = false)
    private String priority;

    @Column
    private String location;

    @Column
    private String preferredLanguage;

    @ElementCollection
    @CollectionTable(name = "case_expertise_tags", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "expertise_tags")
    private java.util.List<String> expertiseTags;

    @OneToMany(mappedBy = "legalCase", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<CaseAttachment> attachments = new java.util.ArrayList<>();

    @Column(nullable = false)
    private String status;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
