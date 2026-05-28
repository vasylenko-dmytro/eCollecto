package com.vasylenko.ecollectobackend.collection;

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
@RequestMapping("/api/me/collection")
@RequiredArgsConstructor
@Tag(name = "Collection", description = "User collection endpoints (protected - requires Bearer JWT).")
public class CollectionController {

    private final CollectionService collectionService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @Operation(summary = "Get collection", description = "Returns all stamps in the authenticated user's collection.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Collection retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = CollectionItemDto.class)))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<CollectionItemDto>> getCollection() {
        String userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(collectionService.getCollection(userId));
    }

    @PostMapping("/items")
    @Operation(summary = "Add to collection", description = "Adds a stamp to the authenticated user's collection.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Stamp added to collection.",
                    content = @Content(schema = @Schema(implementation = CollectionItemDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Stamp already in collection.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<CollectionItemDto> addToCollection(@Valid @RequestBody AddCollectionItemRequest request) {
        String userId = currentUserService.getCurrentUserId();
        CollectionItemDto item = collectionService.addItem(userId, request.getStampId());
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @DeleteMapping("/items/{stampId}")
    @Operation(summary = "Remove from collection", description = "Removes a stamp from the authenticated user's collection.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Stamp removed from collection."),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Stamp not in collection.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> removeFromCollection(@PathVariable String stampId) {
        String userId = currentUserService.getCurrentUserId();
        collectionService.removeItem(userId, stampId);
        return ResponseEntity.noContent().build();
    }
}


