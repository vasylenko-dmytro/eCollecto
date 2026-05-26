package com.vasylenko.ecollectobackend.user;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document("users")
@Getter
@Setter
@ToString
@EqualsAndHashCode(of = "id")
public class UserDocument {
    @Id
    private String id;          // = Keycloak sub (UUID)
    private String email;
    private String name;
    private Instant createdAt;
    private Instant updatedAt;
}

