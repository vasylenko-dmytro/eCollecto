package com.vasylenko.ecollectobackend.common.security;

import tools.jackson.databind.ObjectMapper;
import com.vasylenko.ecollectobackend.dto.ErrorResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthorityConverter jwtAuthorityConverter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthorityConverter jwtAuthorityConverter, ObjectMapper objectMapper) {
        this.jwtAuthorityConverter = jwtAuthorityConverter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ─── Public catalog (readable by everyone) ───
                .requestMatchers(HttpMethod.GET, "/api/stamps").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stamps/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stamp/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/first-day-covers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/first-day-covers/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/designers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/designer/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tariffs").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tariffs/**").permitAll()
                // ─── Actuator / OpenAPI ───
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/v3/api-docs*", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
                // ─── Protected routes ───
                .requestMatchers("/api/me/**").hasRole("USER")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // ─── Everything else requires authentication ───
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthorityConverter))
                // Ensure JWT filter-chain 401/403 use the same { message, code, status } shape
                // as GlobalExceptionHandler — Spring Security bypasses @ControllerAdvice here.
                .authenticationEntryPoint((request, response, ex) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(401);
                    objectMapper.writeValue(response.getWriter(),
                            new ErrorResponse("Unauthorized", "UNAUTHORIZED", 401));
                })
                .accessDeniedHandler((request, response, ex) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(403);
                    objectMapper.writeValue(response.getWriter(),
                            new ErrorResponse("Access denied", "FORBIDDEN", 403));
                })
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:4173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}

