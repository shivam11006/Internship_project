package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.LoginRequest;
import com.example.legalaid_backend.DTO.LoginResponse;
import com.example.legalaid_backend.DTO.RegisterRequest;
import com.example.legalaid_backend.DTO.UserResponse;
import com.example.legalaid_backend.entity.LawyerProfile;
import com.example.legalaid_backend.entity.NgoProfile;
import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.LawyerProfileRepository;
import com.example.legalaid_backend.repository.NgoProfileRepository;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final LawyerProfileRepository lawyerProfileRepository;
    private final NgoProfileRepository ngoProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public UserResponse register(RegisterRequest request){

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        // ENCRYPT PASSWORD
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setRole(request.getRole());
        user = userRepository.save(user);
        Object profile = null;
        if (request.getRole() == Role.LAWYER) {
            profile = createLawyerProfile(user, request);
        } else if (request.getRole() == Role.NGO) {
            profile = createNgoProfile(user, request);
        }

        return convertToResponse(user, profile);
    }

    public LoginResponse login(LoginRequest request) {
        try {
            // Attempt to authenticate
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            // If we reach here, authentication was successful
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Object profile = getProfileForUser(user);

            return LoginResponse.builder()
                    .success(true)
                    .message("Login successful")
                    .user(convertToResponse(user, profile))
                    .build();

        } catch (Exception e) {
            // Authentication failed
            throw new RuntimeException("Invalid email or password");
        }
    }

    private LawyerProfile createLawyerProfile(User user, RegisterRequest request) {
        LawyerProfile profile = new LawyerProfile();
        profile.setUser(user);
        profile.setSpecialization(request.getSpecialization());
        profile.setYearsOfExperience(request.getYearsOfExperience());
        return lawyerProfileRepository.save(profile);
    }

    private NgoProfile createNgoProfile(User user, RegisterRequest request) {
        NgoProfile profile = new NgoProfile();
        profile.setUser(user);
        profile.setRegistrationNumber(request.getRegistrationNumber());
        return ngoProfileRepository.save(profile);
    }

    private Object getProfileForUser(User user) {
        if (user.getRole() == Role.LAWYER) {
            return lawyerProfileRepository.findByUserId(user.getId()).orElse(null);
        } else if (user.getRole() == Role.NGO) {
            return ngoProfileRepository.findByUserId(user.getId()).orElse(null);
        }
        return null;
    }

    private UserResponse convertToResponse(User user, Object profile) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .profile(profile)
                .build();
    }
}
