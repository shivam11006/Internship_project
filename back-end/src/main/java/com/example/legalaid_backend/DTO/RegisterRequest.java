package com.example.legalaid_backend.DTO;


import com.example.legalaid_backend.util.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    // Common field for all users
    private String location;

    // Lawyer-specific fields (optional, used only if role is LAWYER)
    private String specialization;
    private String barNumber;
    private String address;
    private String languages;

    // NGO-specific fields (optional, used only if role is NGO)
    private String organizationName;
    private String registrationNumber;
    private String focusArea;
    // address and languages fields are shared (see above)
}
