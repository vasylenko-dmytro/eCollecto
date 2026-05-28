package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.dto.ErrorResponse;
import com.vasylenko.ecollectobackend.dto.StampDto;
import com.vasylenko.ecollectobackend.dto.YearSummaryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
     * Retrieves a list of all available stamps, optionally filtered by year.
     *
     * @param year Optional release year filter.
     * @return A {@link ResponseEntity} containing a {@link List} of {@link StampDto} objects.
     */
    @GetMapping("/stamps")
    @Operation(summary = "List stamps", description = "Retrieve all stamps, optionally filtered by year.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Stamps retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = StampDto.class)))),
            @ApiResponse(responseCode = "500", description = "Server error.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<StampDto>> getAllStamps(
            @RequestParam(required = false) Integer year) {
        List<StampDto> stamps = (year != null)
                ? stampService.findByYear(year)
                : stampService.findAll();
        return ResponseEntity.ok(stamps);
    }

    /**
     * GET /api/stamps/years
     * Retrieves distinct release years with stamp counts.
     *
     * @return A {@link ResponseEntity} containing a {@link List} of {@link YearSummaryDto} objects.
     */
    @GetMapping("/stamps/years")
    @Operation(summary = "List stamp years", description = "Retrieve distinct release years with stamp counts, sorted descending.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Years retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = YearSummaryDto.class)))),
            @ApiResponse(responseCode = "500", description = "Server error.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<YearSummaryDto>> getStampYears() {
        return ResponseEntity.ok(stampService.findDistinctYears());
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
}
