package com.vasylenko.ecollectobackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Stamp details.")
public class StampDto {
    @Schema(description = "Stamp identifier.")
    @JsonProperty("stamp_id")
    private String stampId;

    @Schema(description = "Stamp name.")
    private String name;
    @Schema(description = "Stamp description.")
    private String description;

    @Schema(description = "Stamp SKU.")
    @JsonProperty("stampSKU")
    private Integer stampSKU;

    @Schema(description = "Stamp metadata.")
    private MetaDto meta;
    @Schema(description = "Release information.")
    private ReleaseDto release;
    @Schema(description = "Image URLs for the stamp.")
    private ImagesDto images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Stamp metadata values.")
    public static class MetaDto {
        @Schema(description = "Denomination text.")
        private String denomination;
        @Schema(description = "Series name.")
        private String series;
        @Schema(description = "Designer name.")
        private String designer;
        @Schema(description = "Perforation indicator.")
        private Boolean perforation;

        @Schema(description = "Number of stamps per pane.")
        @JsonProperty("stampsPerPane")
        private Integer stampsPerPane;

        @Schema(description = "Themes associated with the stamp.")
        private String themes;
        @Schema(description = "Europa stamp indicator.")
        private Boolean europa;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Release details for a stamp.")
    public static class ReleaseDto {
        @Schema(description = "Release year.")
        private Integer year;
        @Schema(description = "Release date.")
        private String date;

        @Schema(description = "Print quantity.")
        @JsonProperty("printQuantity")
        private Integer printQuantity;

        @Schema(description = "Mass issue flag.")
        @JsonProperty("isMassIssue")
        private Boolean isMassIssue;

        @Schema(description = "Availability flag.")
        @JsonProperty("isAvailable")
        private Boolean isAvailable;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Image URLs for a stamp.")
    public static class ImagesDto {
        @Schema(description = "Original image URL.")
        private String original;
        @Schema(description = "Small image URL.")
        private String small;
        @Schema(description = "Pane image URL.")
        private String pane;
    }
}
