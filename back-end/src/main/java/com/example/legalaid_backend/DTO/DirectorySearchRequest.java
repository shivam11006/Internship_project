package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DirectorySearchRequest {
    // Filter by specialization (for lawyers) or focusArea (for NGOs)
    private String expertise;

    // Search by username, email, organization name, etc.
    private String keyword;

    // Filter verified only (approved lawyers/NGOs)
    private Boolean verified = true;

    // Pagination
    private Integer page = 0;
    private Integer size = 20;

    // Sorting
    private String sortBy = "username";  // username, specialization, focusArea
    private String sortOrder = "asc";    // asc or desc
}
