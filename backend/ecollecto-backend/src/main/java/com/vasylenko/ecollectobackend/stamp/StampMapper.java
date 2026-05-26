package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.dto.StampDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * MapStruct mapper for converting {@link StampDocument} to {@link StampDto}.
 * Uses an abstract class to provide custom helpers for denomination formatting,
 * theme joining, and designer-name resolution.
 */
@Mapper(componentModel = "spring")
public abstract class StampMapper {

    @Mapping(target = "stampId",  source = "document.id")
    @Mapping(target = "meta",     expression = "java(toMetaDto(document, designerNames))")
    @Mapping(target = "release",  expression = "java(toReleaseDto(document.getRelease()))")
    @Mapping(target = "images",   expression = "java(toImagesDto(document.getImages()))")
    public abstract StampDto toDto(StampDocument document, Map<String, String> designerNames);

    @Mapping(target = "denomination",  expression = "java(formatDenomination(document))")
    @Mapping(target = "series",        source = "document.meta.series")
    @Mapping(target = "designer",      expression = "java(joinDesignerNames(document, designerNames))")
    @Mapping(target = "perforation",   source = "document.meta.perforation")
    @Mapping(target = "stampsPerPane", source = "document.meta.stampsPerPane")
    @Mapping(target = "themes",        expression = "java(joinThemes(document))")
    @Mapping(target = "europa",        source = "document.meta.europa")
    protected abstract StampDto.MetaDto toMetaDto(StampDocument document, Map<String, String> designerNames);

    @Mapping(target = "year",          source = "year")
    @Mapping(target = "date",          source = "date")
    @Mapping(target = "printQuantity", source = "printQuantity")
    @Mapping(target = "isMassIssue",   source = "isMassIssue")
    @Mapping(target = "isAvailable",   source = "isAvailable")
    protected abstract StampDto.ReleaseDto toReleaseDto(StampDocument.Release release);

    @Mapping(target = "original", source = "original")
    @Mapping(target = "small",    source = "small")
    @Mapping(target = "pane",     source = "pane")
    protected abstract StampDto.ImagesDto toImagesDto(StampDocument.Images images);

    protected String formatDenomination(StampDocument document) {
        StampDocument.Meta meta = document.getMeta();
        if (meta == null) return null;
        StampDocument.Denomination denomination = meta.getDenomination();
        if (denomination == null) return null;
        String code = denomination.getCode();
        if (code != null && !code.isBlank()) return code;
        String currency = denomination.getCurrency();
        return (currency != null && !currency.isBlank()) ? currency : null;
    }

    protected String joinThemes(StampDocument document) {
        StampDocument.Meta meta = document.getMeta();
        if (meta == null || meta.getThemes() == null || meta.getThemes().isEmpty()) return null;
        List<String> filtered = meta.getThemes().stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return filtered.isEmpty() ? null : String.join(", ", filtered);
    }

    protected String joinDesignerNames(StampDocument document, Map<String, String> designerNames) {
        StampDocument.Meta meta = document.getMeta();
        if (meta == null || meta.getDesignerIds() == null || meta.getDesignerIds().isEmpty()) return null;
        List<String> names = meta.getDesignerIds().stream()
                .map(designerNames::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return names.isEmpty() ? null : String.join(", ", names);
    }
}
