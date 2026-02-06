package com.vasylenko.ecollectobackend.designer;

import com.vasylenko.ecollectobackend.dto.DesignerDto;
import com.vasylenko.ecollectobackend.dto.ErrorResponse;
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
 * REST controller for managing designer information.
 * Provides endpoints for retrieving designer details from the ecollecto system.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Slf4j
@Tag(name = "Designers", description = "Designer lookup endpoints.")
public class DesignerController {

    private final DesignerService designerService;

    /**
     * Retrieves a list of all designers associated with the collection.
     *
     * @return A {@link ResponseEntity} containing a {@link List} of {@link DesignerDto} objects.
     * Returns an empty list with a 200 OK status if no designers are currently registered.
     */
    @GetMapping("/designers")
    @Operation(summary = "List designers", description = "Retrieve all designers.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Designers retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = DesignerDto.class)))),
            @ApiResponse(responseCode = "500", description = "Server error.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<DesignerDto>> getAllDesigners() {
        List<DesignerDto> designers = designerService.findAll();
        return ResponseEntity.ok(designers);
    }

    /**
     * GET /api/designer/{id}
     * Retrieves a specific designer by their unique identifier.
     *
     * @param id The unique ID of the designer to retrieve.
     * @return A {@link ResponseEntity} containing the {@link DesignerDto} if a match is found,
     * or a 404 Not Found response if the ID does not exist in the system.
     */
    @GetMapping("/designer/{id}")
    @Operation(summary = "Get designer", description = "Retrieve a designer by id.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Designer found.",
                    content = @Content(schema = @Schema(implementation = DesignerDto.class))),
            @ApiResponse(responseCode = "404", description = "Designer not found."),
            @ApiResponse(responseCode = "500", description = "Server error.",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DesignerDto> getDesignerById(@PathVariable String id) {
        return designerService.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("Designer with id {} not found", id);
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * Exception handler for designer-related errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("An error occurred in DesignerController", e);
        ErrorResponse error = ErrorResponse.builder()
                .message(e.getMessage())
                .code("DESIGNER_ERROR")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
