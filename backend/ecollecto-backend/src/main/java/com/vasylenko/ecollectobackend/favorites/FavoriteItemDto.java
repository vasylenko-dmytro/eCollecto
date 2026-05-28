package com.vasylenko.ecollectobackend.favorites;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "A stamp in the user's favorites.")
public class FavoriteItemDto {

    @Schema(description = "Stamp ID (references stamps._id).", example = "stamp-2024-001")
    private String stampId;

    @Schema(description = "Timestamp when the stamp was added to favorites.")
    private Instant addedAt;
}

