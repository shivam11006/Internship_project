package com.example.legalaid_backend.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final LawyerProfileRepository lawyerProfileRepository;
    private final NgoProfileRepository ngoProfileRepository;

    @Transactional
    public UserResponse registerUser(RegisterRequest request){

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Plain text for now
        user.setRole(request.getRole());

        user = userRepository.save(user);

        Object profile = null;
        if (request.getRole() == Role.LAWYER) {
            profile = createLawyerProfile(user, request);
        } else if (request.getRole() == Role.NGO) {
            profile = createNgoProfile(user, request);
        }

        return convertToResponse(user,profile);

    }


    //Get all users
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    Object profile = getProfileForUser(user);
                    return convertToResponse(user, profile);
                })
                .collect(Collectors.toList());
    }


    // Get user by ID
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Object profile = getProfileForUser(user);
        return convertToResponse(user, profile);
    }


    // Get user by email
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Object profile = getProfileForUser(user);
        return convertToResponse(user, profile);
    }


    // Delete user
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
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
        profile.setNgoName(request.getNgoName());
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
