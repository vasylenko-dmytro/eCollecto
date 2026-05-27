package com.vasylenko.ecollectobackend.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
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

    public SecurityConfig(JwtAuthorityConverter jwtAuthorityConverter) {
        this.jwtAuthorityConverter = jwtAuthorityConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ─── Public catalog (readable by everyone) ───
                .requestMatchers(HttpMethod.GET, "/api/stamps").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stamp/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/first-day-covers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/first-day-covers/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/designers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/designer/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tariffs").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tariffs/**").permitAll()
                // ─── Actuator / OpenAPI ───
                .requestMatchers("/actuator/health").permitAll()
                // "/v3/api-docs*"   covers /v3/api-docs  and  /v3/api-docs.yaml (same segment, different suffix)
                // "/v3/api-docs/**" covers /v3/api-docs/swagger-config and similar sub-paths
                .requestMatchers("/v3/api-docs*", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
                // ─── Protected routes (Phase 4) ───
                .requestMatchers("/api/me/**").hasRole("USER")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // ─── Everything else requires authentication ───
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthorityConverter))
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

