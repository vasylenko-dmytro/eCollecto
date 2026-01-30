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
public class StampDto {
    @JsonProperty("stamp_id")
    private String stampId;
    
    private String name;
    private String description;
    
    @JsonProperty("stampSKU")
    private Integer stampSKU;
    
    private MetaDto meta;
    private ReleaseDto release;
    private ImagesDto images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetaDto {
        private String denomination;
        private String series;
        private String designer;
        private Boolean perforation;
        
        @JsonProperty("stampsPerPane")
        private Integer stampsPerPane;
        
        private String themes;
        private Boolean europa;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReleaseDto {
        private Integer year;
        private String date;
        
        @JsonProperty("printQuantity")
        private Integer printQuantity;
        
        @JsonProperty("isMassIssue")
        private Boolean isMassIssue;
        
        @JsonProperty("isAvailable")
        private Boolean isAvailable;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImagesDto {
        private String original;
        private String small;
        private String pane;
    }
}
