package com.vasylenko.ecollectobackend.dto;

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
public class TariffsDto {
    private String id;
    private Integer year;
    private Instant updatedAt;
    private Map<String, Map<String, Double>> currencies;
}
