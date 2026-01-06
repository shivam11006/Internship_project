package com.example.legalaid_backend.config;

import com.example.legalaid_backend.security.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.messaging.context.SecurityContextChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;
    
    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Native WebSocket endpoint (for Postman and direct WebSocket clients)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(webSocketAuthInterceptor);
        
        // SockJS endpoint (for browser clients with fallback support)
        registry.addEndpoint("/ws/sockjs")
                .setAllowedOriginPatterns("*")
                .addInterceptors(webSocketAuthInterceptor)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        // This ensures authenticated user info is injected into STOMP messages
        registration.interceptors(new SecurityContextChannelInterceptor());
    }

    @Override
    public void configureClientOutboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(new SecurityContextChannelInterceptor());
    }
}

