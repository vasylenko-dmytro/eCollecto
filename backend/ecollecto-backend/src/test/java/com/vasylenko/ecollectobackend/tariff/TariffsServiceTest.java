package com.vasylenko.ecollectobackend.tariff;

import com.vasylenko.ecollectobackend.common.exception.NotFoundException;
import com.vasylenko.ecollectobackend.common.model.Currency;
import com.vasylenko.ecollectobackend.dto.TariffsDto;
import com.vasylenko.ecollectobackend.utils.CollectionTestDataLoader;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TariffsServiceTest {

    @Mock
    private TariffsRepository tariffsRepository;

    @InjectMocks
    private TariffsService tariffsService;

    @Test
    void shouldReturnMappedDtosWhenFindAllInvoked() throws IOException {
        TariffsDocument document = CollectionTestDataLoader.loadTariffsDocument();

        when(tariffsRepository.findAll()).thenReturn(List.of(document));

        List<TariffsDto> result = tariffsService.findAll();

        assertThat(result).hasSize(1);
        TariffsDto dto = result.getFirst();
        assertThat(dto.getId()).isEqualTo(document.getId());
        assertThat(dto.getYear()).isEqualTo(document.getYear());
        assertThat(dto.getUpdatedAt()).isEqualTo(document.getUpdatedAt());
        assertThat(dto.getCurrencies()).isEqualTo(document.getCurrencies());
    }

    @Test
    void shouldReturnDocumentWhenGetByYearFound() throws IOException {
        TariffsDocument document = CollectionTestDataLoader.loadTariffsDocument();

        when(tariffsRepository.findByYear(document.getYear())).thenReturn(Optional.of(document));

        TariffsDocument result = tariffsService.getByYear(document.getYear());

        assertThat(result).isSameAs(document);
    }

    @Test
    void shouldThrowWhenGetByYearMissing() {
        when(tariffsRepository.findByYear(2025)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tariffsService.getByYear(2025))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Tariffs not found for year 2025");
    }

    @Test
    void shouldReturnTariffsByCurrency() throws IOException {
        TariffsDocument document = CollectionTestDataLoader.loadTariffsDocument();

        when(tariffsRepository.findByYear(document.getYear())).thenReturn(Optional.of(document));

        Optional<Map<String, Double>> result =
                tariffsService.getTariffsByCurrency(document.getYear(), Currency.USD);

        assertThat(result).isPresent();
        assertThat(result.get()).containsEntry("A", 1.2);
    }

    @Test
    void shouldReturnTariffByLetter() throws IOException {
        TariffsDocument document = CollectionTestDataLoader.loadTariffsDocument();

        when(tariffsRepository.findByYear(document.getYear())).thenReturn(Optional.of(document));

        Optional<Double> result =
                tariffsService.getTariffByLetter(document.getYear(), Currency.USD, "A");

        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(1.2);
    }

    @Test
    void shouldReturnEmptyWhenTariffLetterMissing() throws IOException {
        TariffsDocument document = CollectionTestDataLoader.loadTariffsDocument();

        when(tariffsRepository.findByYear(document.getYear())).thenReturn(Optional.of(document));

        Optional<Double> result =
                tariffsService.getTariffByLetter(document.getYear(), Currency.USD, "Q");

        assertThat(result).isEmpty();
    }
}
