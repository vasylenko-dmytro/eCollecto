package com.vasylenko.ecollectobackend.wishlist;

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
@RequestMapping("/api/me/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "User wishlist endpoints (protected - requires Bearer JWT).")
public class WishlistController {

    private final WishlistService wishlistService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @Operation(summary = "Get wishlist", description = "Returns all stamps on the authenticated user's wishlist.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Wishlist retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = WishlistItemDto.class)))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<WishlistItemDto>> getWishlist() {
        String userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }

    @PostMapping("/items")
    @Operation(summary = "Add to wishlist", description = "Adds a stamp to the authenticated user's wishlist.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Stamp added to wishlist.",
                    content = @Content(schema = @Schema(implementation = WishlistItemDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Stamp already on wishlist.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<WishlistItemDto> addToWishlist(@Valid @RequestBody AddWishlistItemRequest request) {
        String userId = currentUserService.getCurrentUserId();
        WishlistItemDto item = wishlistService.addItem(userId, request.getStampId());
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @DeleteMapping("/items/{stampId}")
    @Operation(summary = "Remove from wishlist", description = "Removes a stamp from the authenticated user's wishlist.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Stamp removed from wishlist."),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Stamp not on wishlist.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> removeFromWishlist(@PathVariable String stampId) {
        String userId = currentUserService.getCurrentUserId();
        wishlistService.removeItem(userId, stampId);
        return ResponseEntity.noContent().build();
    }
}


