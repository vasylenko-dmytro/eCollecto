package com.vasylenko.ecollectobackend.wishlist;

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
@Schema(description = "A stamp on the user's wishlist.")
public class WishlistItemDto {

    @Schema(description = "Stamp ID (references stamps._id).", example = "stamp-2024-001")
    private String stampId;

    @Schema(description = "Timestamp when the stamp was added to the wishlist.")
    private Instant addedAt;
}

