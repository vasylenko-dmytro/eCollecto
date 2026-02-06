package com.vasylenko.ecollectobackend.fdc;

import com.vasylenko.ecollectobackend.dto.ErrorResponse;
import com.vasylenko.ecollectobackend.dto.FirstDayCoverDto;
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
 * REST controller for managing First Day Covers (FDCs).
 * Provides endpoints for retrieving FDC details within the ecollecto system.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/first-day-covers")
@Slf4j
@Tag(name = "First Day Covers", description = "First day cover lookup endpoints.")
public class FirstDayCoverController {

    private final FirstDayCoverService firstDayCoverService;

    /**
     * GET /api/first-day-covers
     * Retrieves all registered First Day Covers (FDCs).
     *
     * @return A {@link ResponseEntity} containing a {@link List} of {@link FirstDayCoverDto} objects.
     * Defaults to an empty list with a 200 OK status if no records are currently stored.
     */
    @GetMapping
    @Operation(summary = "List first day covers", description = "Retrieve all first day covers.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "First day covers retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FirstDayCoverDto.class)))),
            @ApiResponse(responseCode = "500", description = "Server error.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<FirstDayCoverDto>> getAllFirstDayCovers() {
        List<FirstDayCoverDto> covers = firstDayCoverService.findAll();
        return ResponseEntity.ok(covers);
    }

    /**
     * GET /api/first-day-covers/{id}
     * Retrieves a specific First Day Cover (FDC) by its unique identifier.
     *
     * @param id The unique ID of the First Day Cover to retrieve.
     * @return A {@link ResponseEntity} containing the {@link FirstDayCoverDto} if found;
     * otherwise, a 404 Not Found response.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get first day cover", description = "Retrieve a first day cover by id.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "First day cover found.",
                    content = @Content(schema = @Schema(implementation = FirstDayCoverDto.class))),
            @ApiResponse(responseCode = "404", description = "First day cover not found."),
            @ApiResponse(responseCode = "500", description = "Server error.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<FirstDayCoverDto> getFirstDayCoverById(@PathVariable String id) {
        return firstDayCoverService.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("First day cover with id {} not found", id);
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * Exception handler for first day cover-related errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("An error occurred in FirstDayCoverController", e);
        ErrorResponse error = ErrorResponse.builder()
                .message(e.getMessage())
                .code("FIRST_DAY_COVER_ERROR")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
