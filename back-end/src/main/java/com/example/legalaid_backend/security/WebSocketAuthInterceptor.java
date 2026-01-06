package com.example.legalaid_backend.security;

import com.example.legalaid_backend.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public boolean beforeHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                                   @NonNull WebSocketHandler wsHandler, @NonNull Map<String, Object> attributes) throws Exception {
        try {
            log.debug("WebSocket handshake attempt from: {}", request.getURI());
            
            // Extract JWT token from Authorization header
            String token = extractTokenFromRequest(request);
            
            if (token == null) {
                log.warn("WebSocket handshake failed: No token found in request. URI: {}", request.getURI());
                response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                return false;
            }
            
            log.debug("Token extracted, validating...");
            
            if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
                // Get user email from token
                String email = tokenProvider.getEmailFromToken(token);
                log.debug("Token valid for user: {}", email);
                
                // Load user details
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                
                // Create authentication object
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                
                // Set authentication in SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Store user email in attributes for later use
                attributes.put("userEmail", email);
                
                log.info("WebSocket handshake authenticated for user: {}", email);
                return true; // Allow handshake to proceed
            } else {
                log.warn("WebSocket handshake failed: Invalid JWT token");
                response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                return false; // Reject handshake
            }
        } catch (Exception ex) {
            log.error("Error during WebSocket handshake authentication: {}", ex.getMessage(), ex);
            response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return false; // Reject handshake
        }
    }

    @Override
    public void afterHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                               @NonNull WebSocketHandler wsHandler, @Nullable Exception exception) {
        // Clean up if needed
        if (exception != null) {
            log.error("WebSocket handshake error", exception);
        }
    }

    private String extractTokenFromRequest(ServerHttpRequest request) {
        // Try to get token from Authorization header
        List<String> authHeaders = request.getHeaders().get("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String bearerToken = authHeaders.get(0);
            if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
                log.debug("Token found in Authorization header");
                return bearerToken.substring(7);
            }
        }
        
        // Also try to get token from query parameter (for clients that can't set headers)
        String query = request.getURI().getQuery();
        if (query != null && !query.isEmpty()) {
            log.debug("Checking query parameters: {}", query);
            Map<String, String> queryParams = parseQueryString(query);
            String tokenParam = queryParams.get("token");
            if (StringUtils.hasText(tokenParam)) {
                log.debug("Token found in query parameter");
                // Token is already decoded in parseQueryString
                return tokenParam;
            }
        }
        
        log.debug("No token found in headers or query parameters");
        return null;
    }

    private Map<String, String> parseQueryString(String query) {
        try {
            return java.util.Arrays.stream(query.split("&"))
                    .map(param -> {
                        String[] parts = param.split("=", 2);
                        if (parts.length == 2) {
                            try {
                                // URL decode both key and value
                                String key = java.net.URLDecoder.decode(parts[0], java.nio.charset.StandardCharsets.UTF_8);
                                String value = java.net.URLDecoder.decode(parts[1], java.nio.charset.StandardCharsets.UTF_8);
                                return new String[]{key, value};
                            } catch (Exception e) {
                                log.warn("Error decoding query parameter: {}", e.getMessage());
                                return parts;
                            }
                        }
                        return parts;
                    })
                    .filter(parts -> parts.length == 2)
                    .collect(java.util.stream.Collectors.toMap(
                            parts -> parts[0],
                            parts -> parts[1],
                            (v1, v2) -> v1
                    ));
        } catch (Exception e) {
            log.error("Error parsing query string: {}", e.getMessage());
            return Map.of();
        }
    }
}
