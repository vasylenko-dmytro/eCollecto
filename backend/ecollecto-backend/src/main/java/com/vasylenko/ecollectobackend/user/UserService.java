package com.vasylenko.ecollectobackend.user;

import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Returns an existing user profile or creates a new one on first access.
     * The keycloakSub is the Keycloak JWT subject (UUID).
     */
    public UserDto getOrCreateProfile(String keycloakSub) {
        return userRepository.findById(keycloakSub)
                .map(this::toDto)
                .orElseGet(() -> {
                    UserDocument doc = new UserDocument();
                    doc.setId(keycloakSub);
                    doc.setCreatedAt(Instant.now());
                    doc.setUpdatedAt(Instant.now());
                    UserDocument saved = userRepository.save(doc);
                    return toDto(saved);
                });
    }

    private UserDto toDto(UserDocument doc) {
        return UserDto.builder()
                .id(doc.getId())
                .email(doc.getEmail())
                .name(doc.getName())
                .build();
    }
}

