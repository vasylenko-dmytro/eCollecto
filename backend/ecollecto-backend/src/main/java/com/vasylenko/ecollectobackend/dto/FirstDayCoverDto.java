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
@Schema(description = "First day cover details.")
public class FirstDayCoverDto {
    @Schema(description = "Postmark identifier.")
    @JsonProperty("postmark_id")
    private String postmarkId;

    @Schema(description = "Envelope identifier.")
    @JsonProperty("envelope_id")
    private String envelopeId;

    @Schema(description = "Name of the first day cover.")
    private String name;
    @Schema(description = "Short description.")
    private String description;

    @Schema(description = "Postmark SKU.")
    @JsonProperty("postmarkSKU")
    private Integer postmarkSKU;

    @Schema(description = "Envelope SKU.")
    @JsonProperty("envelopeSKU")
    private Integer envelopeSKU;

    @Schema(description = "Designer name.")
    private String designer;

    @Schema(description = "Release information.")
    private ReleaseDto release;
    @Schema(description = "Image URLs for the cover.")
    private ImagesDto images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Release details for a first day cover.")
    public static class ReleaseDto {
        @Schema(description = "Release year.")
        private Integer year;
        @Schema(description = "Release date.")
        private String date;

        @Schema(description = "Print quantity.")
        @JsonProperty("printQuantity")
        private Integer printQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Image URLs for a first day cover.")
    public static class ImagesDto {
        @Schema(description = "Envelope image URL.")
        private String envelope;
        @Schema(description = "Postmark image URL.")
        private String postmark;
    }
}
