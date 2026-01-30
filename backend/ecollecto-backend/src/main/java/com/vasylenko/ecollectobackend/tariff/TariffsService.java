package com.vasylenko.ecollectobackend.tariff;

import com.vasylenko.ecollectobackend.common.exception.NotFoundException;
import com.vasylenko.ecollectobackend.common.model.Currency;
import com.vasylenko.ecollectobackend.dto.TariffsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Handles the retrieval of year-specific tariffs and provides granular access to
 * currency-based and letter-based rates.
 */
@Service
@RequiredArgsConstructor
public class TariffsService {
    private final TariffsRepository repository;

    /**
     * Retrieves all tariff documents and converts them to DTOs.
     *
     * @return A list of {@link TariffsDto} containing data for all years.
     */
    public List<TariffsDto> findAll() {
        return repository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a tariff document for a specific year.
     *
     * @param year The year to search for.
     * @return The {@link TariffsDocument} for the requested year.
     * @throws NotFoundException if no tariffs exist for the specified year.
     */
    public TariffsDocument getByYear(Integer year) {
        return repository.findByYear(year)
                .orElseThrow(() ->
                        new NotFoundException("Tariffs not found for year " + year));
    }

    /**
     * Retrieves a map of letter codes to prices for a specific year and currency.
     *
     * @param year     The year of the tariff.
     * @param currency The {@link Currency} (e.g., UAH, USD).
     * @return An {@link Optional} containing the map of tariffs, or empty if not found.
     */
    public Optional<Map<String, Double>> getTariffsByCurrency(
            Integer year,
            Currency currency) {

        return Optional.ofNullable(getByYear(year))
                .map(TariffsDocument::getCurrencies)
                .map(currencies -> currencies.get(currency.name()));
    }

    /**
     * Retrieves the price for a specific postal letter code.
     *
     * @param year     The year of the tariff.
     * @param currency The {@link Currency}.
     * @param letter   The postal letter code (e.g., "A", "W").
     * @return An {@link Optional} containing the specific price as a {@link Double}.
     */
    public Optional<Double> getTariffByLetter(
            Integer year,
            Currency currency,
            String letter) {

        return getTariffsByCurrency(year, currency)
                .map(tariffs -> tariffs.get(letter));
    }

    /**
     * Converts a database document to a Data Transfer Object.
     *
     * @param document The source {@link TariffsDocument}.
     * @return A populated {@link TariffsDto}.
     */
    private TariffsDto toDto(TariffsDocument document) {
        return TariffsDto.builder()
                .id(document.getId())
                .year(document.getYear())
                .updatedAt(document.getUpdatedAt())
                .currencies(document.getCurrencies())
                .build();
    }
}
