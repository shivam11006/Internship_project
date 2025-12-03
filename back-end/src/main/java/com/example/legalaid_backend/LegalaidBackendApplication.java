package com.example.legalaid_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LegalaidBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(LegalaidBackendApplication.class, args);

        System.out.println("\n=================================");
        System.out.println("Legal Aid API is running!");
        System.out.println("=================================");
        System.out.println("API Base URL: http://localhost:8080");
        System.out.println("H2 Console:   http://localhost:8080/h2-console");
        System.out.println("=================================\n");

    }
}
