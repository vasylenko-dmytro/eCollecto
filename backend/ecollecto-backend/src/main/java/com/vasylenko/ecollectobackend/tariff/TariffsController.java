package com.vasylenko.ecollectobackend.tariff;

import com.vasylenko.ecollectobackend.common.model.Currency;
import com.vasylenko.ecollectobackend.dto.ErrorResponse;
import com.vasylenko.ecollectobackend.dto.TariffsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for managing postal tariffs.
 * Provides endpoints to query historical and current postal rates categorized by
 * year, currency, and postal letter codes.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tariffs")
@Slf4j
public class TariffsController {

    private final TariffsService service;

    /**
     * GET /api/tariffs
     * <p>
     * Returns a list of all available tariffs.
     * Each item represents tariffs for a specific year,
     * including all supported currencies and letter-based values.
     * </p>
     *
     * @return {@link ResponseEntity} containing a list of {@link TariffsDto}
     *         objects with tariff data
     */
    @GetMapping
    public ResponseEntity<List<TariffsDto>> getAllTariffs() {
        List<TariffsDto> tariffs = service.findAll();
        return ResponseEntity.ok(tariffs);
    }

    /**
     * GET /api/tariffs/{year}/{currency}
     * <p>
     * Returns all tariffs for the given year and currency.
     * </p>
     *
     * @param year     the year for which tariffs are requested (e.g., 2022)
     * @param currency the currency of tariffs (UAH, USD)
     * @return {@link ResponseEntity} containing a map of letter-to-tariff values
     */
    @GetMapping("/{year}/{currency}")
    public ResponseEntity<Map<String, Double>> getAllTariffsByCurrency(
            @PathVariable Integer year,
            @PathVariable Currency currency) {

        return service.getTariffsByCurrency(year, currency)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("Tariffs not found for year: {} and currency: {}", year, currency);
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * GET /api/tariffs/{year}/{currency}/{letter}
     * <p>
     * Returns a single tariff value for the given year, currency, and postal letter.
     * The tariff represents the cost of sending a postal item identified by the letter
     * (e.g. "A", "B", etc.) in the specified currency.
     * </p>
     *
     * @param year     the year for which the tariff is requested (e.g. 2024)
     * @param currency the currency of the tariff (allowed values: UAH, USD)
     * @param letter   the postal letter code identifying the tariff
     * @return the tariff value as {@link Double}
     *
     * @throws org.springframework.web.server.ResponseStatusException
     *         if the tariff for the given parameters is not found
     */
    @GetMapping("/{year}/{currency}/{letter}")
    public ResponseEntity<Double> getTariff(
            @PathVariable Integer year,
            @PathVariable Currency currency,
            @PathVariable String letter) {

        return service.getTariffByLetter(year, currency, letter)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    log.warn("Tariff not found for year: {}, currency: {}, letter: {}", year, currency, letter);
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * Exception handler for tariff-related errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        ErrorResponse error = ErrorResponse.builder()
                .message(e.getMessage())
                .code("TARIFF_ERROR")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
