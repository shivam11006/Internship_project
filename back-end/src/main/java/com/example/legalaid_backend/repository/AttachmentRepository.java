package com.example.legalaid_backend.repository;

import com.example.legalaid_backend.entity.CaseAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachmentRepository extends JpaRepository<CaseAttachment, Long> {
}
