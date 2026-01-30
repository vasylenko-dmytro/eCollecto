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
public class FirstDayCoverDto {
    @JsonProperty("postmark_id")
    private String postmarkId;
    
    @JsonProperty("envelope_id")
    private String envelopeId;
    
    private String name;
    private String description;
    
    @JsonProperty("postmarkSKU")
    private Integer postmarkSKU;
    
    @JsonProperty("envelopeSKU")
    private Integer envelopeSKU;
    
    private String designer;
    
    private ReleaseDto release;
    private ImagesDto images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReleaseDto {
        private Integer year;
        private String date;
        
        @JsonProperty("printQuantity")
        private Integer printQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImagesDto {
        private String envelope;
        private String postmark;
    }
}
