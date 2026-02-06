package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.dto.ErrorResponse;
import com.vasylenko.ecollectobackend.dto.StampDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing stamp collection data.
 * Provides endpoints for browsing and retrieving specific postage stamps.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Slf4j
@Tag(name = "Stamps", description = "Stamp lookup endpoints.")
public class StampController {

    private final StampService stampService;

    /**
     * GET /api/stamps
     * Retrieves a list of all available stamps.
     *
     * @return A {@link ResponseEntity} containing a {@link List} of {@link StampDto} objects.
     * Returns an empty list with a 200 OK status if no stamps are found in the system.
     */
    @GetMapping("/stamps")
    @Operation(summary = "List stamps", description = "Retrieve all stamps.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Stamps retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = StampDto.class)))),
            @ApiResponse(responseCode = "500", description = "Server error.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<StampDto>> getAllStamps() {
        List<StampDto> stamps = stampService.findAll();
        return ResponseEntity.ok(stamps);
    }

    /**
     * GET /api/stamp/{id}
     * Retrieves a specific stamp by its unique identifier.
     *
     * @param id The unique ID of the stamp to retrieve.
     * @return A {@link ResponseEntity} containing the {@link StampDto} if found,
     * or a 404 Not Found status if no stamp exists with the given ID.
     */
    @GetMapping("/stamp/{id}")
    @Operation(summary = "Get stamp", description = "Retrieve a stamp by id.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Stamp found.",
                    content = @Content(schema = @Schema(implementation = StampDto.class))),
            @ApiResponse(responseCode = "404", description = "Stamp not found."),
            @ApiResponse(responseCode = "500", description = "Server error.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<StampDto> getStampById(@PathVariable String id) {
        return stampService.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("Stamp with id {} not found", id);
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * Exception handler for stamp-related errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        ErrorResponse error = ErrorResponse.builder()
                .message(e.getMessage())
                .code("STAMP_ERROR")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
