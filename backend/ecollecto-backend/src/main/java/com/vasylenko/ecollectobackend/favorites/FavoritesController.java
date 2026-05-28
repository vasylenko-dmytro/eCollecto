package com.vasylenko.ecollectobackend.favorites;

import com.vasylenko.ecollectobackend.common.security.CurrentUserService;
import com.vasylenko.ecollectobackend.dto.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites", description = "User favorites endpoints (protected - requires Bearer JWT).")
public class FavoritesController {

    private final FavoritesService favoritesService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @Operation(summary = "Get favorites", description = "Returns all stamps in the authenticated user's favorites.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Favorites retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FavoriteItemDto.class)))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<FavoriteItemDto>> getFavorites() {
        String userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(favoritesService.getFavorites(userId));
    }

    @PostMapping("/items")
    @Operation(summary = "Add to favorites", description = "Adds a stamp to the authenticated user's favorites.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Stamp added to favorites.",
                    content = @Content(schema = @Schema(implementation = FavoriteItemDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Stamp already in favorites.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<FavoriteItemDto> addToFavorites(@Valid @RequestBody AddFavoriteItemRequest request) {
        String userId = currentUserService.getCurrentUserId();
        FavoriteItemDto item = favoritesService.addItem(userId, request.getStampId());
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @DeleteMapping("/items/{stampId}")
    @Operation(summary = "Remove from favorites", description = "Removes a stamp from the authenticated user's favorites.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Stamp removed from favorites."),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Stamp not in favorites.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> removeFromFavorites(@PathVariable String stampId) {
        String userId = currentUserService.getCurrentUserId();
        favoritesService.removeItem(userId, stampId);
        return ResponseEntity.noContent().build();
    }
}


