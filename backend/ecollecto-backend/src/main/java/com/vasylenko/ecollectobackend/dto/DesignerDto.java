package com.vasylenko.ecollectobackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesignerDto {
    @JsonProperty("designer_id")
    private String designerId;
    
    private String name;
}
