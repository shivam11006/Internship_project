package com.example.legalaid_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    // Get Signing Key
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return generateToken(userDetails.getUsername(), jwtExpirationMs);
    }

    public String generateRefreshToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return generateToken(userDetails.getUsername(), refreshExpirationMs);
    }

    public String generateRefreshToken(String email) {
        return generateToken(email, refreshExpirationMs);
    }

    private String generateToken(String email, long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(email)                    // Set user identifier
                .issuedAt(now)                     // Set creation time
                .expiration(expiryDate)            // Set expiration time
                .signWith(getSigningKey())         // Sign with secret key
                .compact();                        // Build and return as string
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())       // Verify with our secret key
                .build()
                .parseSignedClaims(token)          // Parse the token
                .getPayload();                     // Get the payload (claims)

        return claims.getSubject();                // Return the subject (email)
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())   // Verify signature
                    .build()
                    .parseSignedClaims(token);     // Parse token

            return true;  // Token is valid

        } catch (JwtException | IllegalArgumentException e) {
            // Token is invalid
            return false;
        }
    }
}
