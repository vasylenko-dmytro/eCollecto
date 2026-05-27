package com.vasylenko.ecollectobackend.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Authenticated user profile.")
public class UserDto {

    @Schema(description = "Keycloak user UUID (sub claim).", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private String id;

    @Schema(description = "User email address.", example = "testuser@ecollecto.dev")
    private String email;

    @Schema(description = "User display name.", example = "Test User")
    private String name;
}
