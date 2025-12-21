package com.example.legalaid_backend.config;

import com.example.legalaid_backend.entity.User;
import com.example.legalaid_backend.repository.UserRepository;
import com.example.legalaid_backend.util.ApprovalStatus;
import com.example.legalaid_backend.util.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner initDatabase() {
        return args -> {
            // Create default admin if not exists
            if (!userRepository.existsByEmail("admin@legalaid.com")) {
                User admin = new User();
                admin.setUsername("Admin");
                admin.setEmail("admin@legalaid.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(Role.ADMIN);
                admin.setApprovalStatus(ApprovalStatus.APPROVED);
                admin.setEnabled(true);
                
                userRepository.save(admin);
                
                System.out.println("\n=================================");
                System.out.println("Default Admin Account Created:");
                System.out.println("Email: admin@legalaid.com");
                System.out.println("Password: admin123");
                System.out.println("=================================\n");
            }
        };
    }
}
