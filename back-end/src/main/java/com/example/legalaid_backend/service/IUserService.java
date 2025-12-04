package com.example.legalaid_backend.service;

import com.example.legalaid_backend.DTO.RegisterRequest;
import com.example.legalaid_backend.DTO.UserResponse;

import java.util.List;

public interface IUserService {
    
    /**
     * Register a new user with profile based on role
     * @param request Registration details
     * @return UserResponse with created user details
     */
    UserResponse registerUser(RegisterRequest request);
    
    /**
     * Get all users from the system
     * @return List of all users with their profiles
     */
    List<UserResponse> getAllUsers();
    
    /**
     * Get user by ID
     * @param id User ID
     * @return UserResponse with user details
     */
    UserResponse getUserById(Long id);
    
    /**
     * Get user by email
     * @param email User email
     * @return UserResponse with user details
     */
    UserResponse getUserByEmail(String email);
    
    /**
     * Delete user by ID
     * @param id User ID to delete
     */
    void deleteUser(Long id);
}