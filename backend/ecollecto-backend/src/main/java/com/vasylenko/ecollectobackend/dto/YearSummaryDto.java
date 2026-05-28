package com.vasylenko.ecollectobackend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Year summary with stamp count.")
public class YearSummaryDto {
    @Schema(description = "Release year.", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer year;

    @Schema(description = "Number of stamps released in this year.", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long count;
}

