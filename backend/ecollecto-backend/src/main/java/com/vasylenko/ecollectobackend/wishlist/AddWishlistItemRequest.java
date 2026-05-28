package com.vasylenko.ecollectobackend.wishlist;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request body to add a stamp to the user's wishlist.")
public class AddWishlistItemRequest {

    @NotBlank(message = "stampId must not be blank")
    @Schema(description = "Stamp ID to add.", example = "stamp-2024-001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String stampId;
}

