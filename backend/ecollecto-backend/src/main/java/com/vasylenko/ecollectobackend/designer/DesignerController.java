package com.vasylenko.ecollectobackend.designer;

import com.vasylenko.ecollectobackend.dto.DesignerDto;
import com.vasylenko.ecollectobackend.dto.ErrorResponse;
import lombok.RequiredArgsConstructor;
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
public class DesignerController {

    private final DesignerService designerService;

    /**
     * Retrieves a list of all designers associated with the collection.
     *
     * @return A {@link ResponseEntity} containing a {@link List} of {@link DesignerDto} objects.
     * Returns an empty list with a 200 OK status if no designers are currently registered.
     */
    @GetMapping("/designers")
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
    public ResponseEntity<DesignerDto> getDesignerById(@PathVariable String id) {
        return designerService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Exception handler for designer-related errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        ErrorResponse error = ErrorResponse.builder()
                .message(e.getMessage())
                .code("DESIGNER_ERROR")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
