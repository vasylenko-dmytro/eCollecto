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
    @Schema(description = "Stamp identifier.", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("stamp_id")
    private String stampId;

    @Schema(description = "Stamp name.", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "Stamp description.", requiredMode = Schema.RequiredMode.REQUIRED)
    private String description;

    @Schema(description = "Stamp SKU.", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("stampSKU")
    private Integer stampSKU;

    @Schema(description = "Stamp metadata.", requiredMode = Schema.RequiredMode.REQUIRED)
    private MetaDto meta;

    @Schema(description = "Release information.", requiredMode = Schema.RequiredMode.REQUIRED)
    private ReleaseDto release;

    @Schema(description = "Image URLs for the stamp.", requiredMode = Schema.RequiredMode.REQUIRED)
    private ImagesDto images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "StampMeta", description = "Stamp metadata values.")
    public static class MetaDto {
        @Schema(description = "Denomination text.", requiredMode = Schema.RequiredMode.REQUIRED)
        private String denomination;

        @Schema(description = "Series name.", requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        private String series;

        @Schema(description = "Designer name.", requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        private String designer;

        @Schema(description = "Perforation indicator.", requiredMode = Schema.RequiredMode.REQUIRED)
        private Boolean perforation;

        @Schema(description = "Number of stamps per pane.", requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        @JsonProperty("stampsPerPane")
        private Integer stampsPerPane;

        @Schema(description = "Themes associated with the stamp.", requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        private String themes;

        @Schema(description = "Europa stamp indicator.", requiredMode = Schema.RequiredMode.REQUIRED)
        private Boolean europa;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "StampRelease", description = "Release details for a stamp.")
    public static class ReleaseDto {
        @Schema(description = "Release year.", requiredMode = Schema.RequiredMode.REQUIRED)
        private Integer year;

        @Schema(description = "Release date.", requiredMode = Schema.RequiredMode.REQUIRED)
        private String date;

        @Schema(description = "Print quantity.", requiredMode = Schema.RequiredMode.REQUIRED)
        @JsonProperty("printQuantity")
        private Integer printQuantity;

        @Schema(description = "Mass issue flag.", requiredMode = Schema.RequiredMode.REQUIRED)
        @JsonProperty("isMassIssue")
        private Boolean isMassIssue;

        @Schema(description = "Availability flag.", requiredMode = Schema.RequiredMode.REQUIRED)
        @JsonProperty("isAvailable")
        private Boolean isAvailable;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "StampImages", description = "Image URLs for a stamp.")
    public static class ImagesDto {
        @Schema(description = "Original image URL.", requiredMode = Schema.RequiredMode.REQUIRED)
        private String original;

        @Schema(description = "Small image URL.", requiredMode = Schema.RequiredMode.REQUIRED)
        private String small;

        @Schema(description = "Pane image URL.", requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        private String pane;
    }
}
