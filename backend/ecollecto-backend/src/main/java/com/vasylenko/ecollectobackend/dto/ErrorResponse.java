package com.vasylenko.ecollectobackend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Error response payload.")
public class ErrorResponse {
    @Schema(description = "Error message.")
    private String message;
    @Schema(description = "Error code.")
    private String code;
    @Schema(description = "HTTP status code.")
    private Integer status;
}
