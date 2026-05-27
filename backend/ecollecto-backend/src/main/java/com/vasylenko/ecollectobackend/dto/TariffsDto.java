package com.vasylenko.ecollectobackend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Postal tariff listing by year and currency.")
public class TariffsDto {
    @Schema(description = "Tariff document identifier.", requiredMode = Schema.RequiredMode.REQUIRED)
    private String id;

    @Schema(description = "Tariff year.", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer year;

    @Schema(description = "Last update timestamp.", requiredMode = Schema.RequiredMode.REQUIRED)
    private Instant updatedAt;

    @Schema(description = "Tariffs mapped by currency and letter.", requiredMode = Schema.RequiredMode.REQUIRED)
    private Map<String, Map<String, Double>> currencies;
}
