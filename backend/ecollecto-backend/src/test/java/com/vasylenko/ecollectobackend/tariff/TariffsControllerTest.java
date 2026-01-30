package com.vasylenko.ecollectobackend.tariff;

import com.vasylenko.ecollectobackend.common.model.Currency;
import com.vasylenko.ecollectobackend.dto.TariffsDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TariffsControllerTest {
    private static final Integer TARIFF_YEAR = 2026;

    private MockMvc mockMvc;

    @Mock
    private TariffsService tariffsService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TariffsController(tariffsService)).build();
    }

    @Test
    void shouldReturnAllTariffs() throws Exception {
        TariffsDto dto = TariffsDto.builder()
                .id("t2026")
                .year(TARIFF_YEAR)
                .updatedAt(Instant.parse("2026-01-01T00:00:00Z"))
                .currencies(Map.of("USD", Map.of("A", 1.2)))
                .build();

        when(tariffsService.findAll()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/tariffs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("t2026"))
                .andExpect(jsonPath("$[0].year").value(TARIFF_YEAR))
                .andExpect(jsonPath("$[0].currencies.USD.A").value(1.2));
    }

    @Test
    void shouldReturnTariffsByCurrencyWhenFound() throws Exception {
        when(tariffsService.getTariffsByCurrency(TARIFF_YEAR, Currency.USD))
                .thenReturn(Optional.of(Map.of("A", 1.2)));

        mockMvc.perform(get("/api/tariffs/" + TARIFF_YEAR + "/USD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.A").value(1.2));
    }

    @Test
    void shouldReturnNotFoundWhenTariffsByCurrencyMissing() throws Exception {
        when(tariffsService.getTariffsByCurrency(TARIFF_YEAR, Currency.USD))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/tariffs/" + TARIFF_YEAR + "/USD"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnTariffByLetterWhenFound() throws Exception {
        when(tariffsService.getTariffByLetter(TARIFF_YEAR, Currency.USD, "A"))
                .thenReturn(Optional.of(1.2));

        mockMvc.perform(get("/api/tariffs/" + TARIFF_YEAR + "/USD/A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(1.2));
    }

    @Test
    void shouldReturnNotFoundWhenTariffByLetterMissing() throws Exception {
        when(tariffsService.getTariffByLetter(TARIFF_YEAR, Currency.USD, "A"))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/tariffs/" + TARIFF_YEAR + "/USD/A"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnErrorResponseWhenServiceThrows() throws Exception {
        when(tariffsService.findAll()).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/tariffs"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("boom"))
                .andExpect(jsonPath("$.code").value("TARIFF_ERROR"))
                .andExpect(jsonPath("$.status").value(500));
    }
}
