package com.example.legalaid_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "case_attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaseAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(columnDefinition = "bytea", nullable = false)
    private byte[] content;

    @ManyToOne
    @JoinColumn(name = "case_id", nullable = false)
    private Case legalCase;
}
