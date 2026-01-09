package com.example.legalaid_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String content; // Base64 encoded content (optional, only for inline display)
    
    // Backward compatibility - these fields might come from older clients
    private String name;  // alias for fileName
    private String type;  // alias for fileType
    
    // Getter methods for backward compatibility
    public String getName() {
        return name != null ? name : fileName;
    }
    
    public String getType() {
        return type != null ? type : fileType;
    }
}
