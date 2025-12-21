package com.example.legalaid_backend.DTO;


import com.example.legalaid_backend.util.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalResponse {

    private Long userId;
    private String username;
    private String email;
    private ApprovalStatus approvalStatus;
}