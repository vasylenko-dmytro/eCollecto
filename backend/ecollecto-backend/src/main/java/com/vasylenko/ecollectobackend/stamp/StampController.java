package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.dto.ErrorResponse;
import com.vasylenko.ecollectobackend.dto.StampDto;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<StampDto> getStampById(@PathVariable String id) {
        return stampService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
