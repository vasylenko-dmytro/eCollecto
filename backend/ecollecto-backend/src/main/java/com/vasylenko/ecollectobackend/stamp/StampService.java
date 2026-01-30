package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.dto.StampDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * This service handles complex data mapping, including resolving multiple designer names
 * and formatting denomination and theme information for the UI.
 */
@Service
@RequiredArgsConstructor
public class StampService {
    private final StampRepository stampRepository;
    private final com.vasylenko.ecollectobackend.designer.DesignerRepository designerRepository;

    /**
     * Retrieves all stamps with fully resolved metadata.
     * Extracts all unique designer IDs from the collection of stamps to perform
     * a single bulk lookup, optimizing database performance.
     *
     * @return A list of {@link StampDto} objects.
     */
    public List<StampDto> findAll() {
        List<StampDocument> documents = stampRepository.findAll();
        Set<String> designerIds = documents.stream()
                .map(StampDocument::getMeta)
                .filter(Objects::nonNull)
                .map(StampDocument.Meta::getDesignerIds)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .collect(Collectors.toSet());
        Map<String, String> designerNames = loadDesignerNames(designerIds);

        return documents.stream()
                .map(document -> toDto(document, designerNames))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a specific stamp by its ID and resolves its associated designer names.
     *
     * @param id The unique identifier of the stamp.
     * @return An {@link Optional} containing the {@link StampDto} if found.
     */
    public Optional<StampDto> findById(String id) {
        return stampRepository.findById(id).map(document -> {
            Set<String> designerIds = Optional.ofNullable(document.getMeta())
                    .map(StampDocument.Meta::getDesignerIds)
                    .map(list -> list.stream().filter(Objects::nonNull).collect(Collectors.toSet()))
                    .orElse(Set.of());
            Map<String, String> designerNames = loadDesignerNames(designerIds);
            return toDto(document, designerNames);
        });
    }

    /**
     * Resolves designer IDs into names using the Designer repository.
     *
     * @param designerIds Collection of designer identifiers to look up.
     * @return A mapping of IDs to Designer Names.
     */
    private Map<String, String> loadDesignerNames(Collection<String> designerIds) {
        if (designerIds == null || designerIds.isEmpty()) {
            return Map.of();
        }
        return designerRepository.findAllById(designerIds).stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(
                        com.vasylenko.ecollectobackend.designer.DesignerDocument::getId,
                        com.vasylenko.ecollectobackend.designer.DesignerDocument::getName,
                        (existing, replacement) -> existing
                ));
    }

    /**
     * Maps a {@link StampDocument} to a {@link StampDto}.
     * Handles the complex flattening of nested Meta, Release, and Image objects.
     *
     * @param document The source database document.
     * @param designerNames Pre-resolved map of designer names.
     * @return A constructed DTO for API response.
     */
    private StampDto toDto(StampDocument document, Map<String, String> designerNames) {
        StampDocument.Meta meta = document.getMeta();
        StampDocument.Release release = document.getRelease();
        StampDocument.Images images = document.getImages();

        return StampDto.builder()
                .stampId(document.getId())
                .name(document.getName())
                .description(document.getDescription())
                .stampSKU(document.getStampSKU())
                .meta(StampDto.MetaDto.builder()
                        .denomination(formatDenomination(meta != null ? meta.getDenomination() : null))
                        .series(meta != null ? meta.getSeries() : null)
                        .designer(joinDesignerNames(meta != null ? meta.getDesignerIds() : null, designerNames))
                        .perforation(meta != null ? meta.getPerforation() : null)
                        .stampsPerPane(meta != null ? meta.getStampsPerPane() : null)
                        .themes(joinThemes(meta != null ? meta.getThemes() : null))
                        .europa(meta != null ? meta.getEuropa() : null)
                        .build())
                .release(StampDto.ReleaseDto.builder()
                        .year(release != null ? release.getYear() : null)
                        .date(release != null ? release.getDate() : null)
                        .printQuantity(release != null ? release.getPrintQuantity() : null)
                        .isMassIssue(release != null ? release.getIsMassIssue() : null)
                        .isAvailable(release != null ? release.getIsAvailable() : null)
                        .build())
                .images(StampDto.ImagesDto.builder()
                        .original(images != null ? images.getOriginal() : null)
                        .small(images != null ? images.getSmall() : null)
                        .pane(images != null ? images.getPane() : null)
                        .build())
                .build();
    }

    /**
     * Formats the denomination string, prioritizing the alphabetic code (like 'W' or 'V')
     * over the currency string.
     *
     * @param denomination The denomination entity from the document.
     * @return A formatted string or null.
     */
    private String formatDenomination(StampDocument.Denomination denomination) {
        if (denomination == null) {
            return null;
        }
        String code = denomination.getCode();
        if (code != null && !code.isBlank()) {
            return code;
        }
        String currency = denomination.getCurrency();
        return currency != null && !currency.isBlank() ? currency : null;
    }

    /**
     * Combines a list of themes into a single comma-separated string.
     *
     * @param themes List of theme strings.
     * @return A joined string or null if empty.
     */
    private String joinThemes(List<String> themes) {
        if (themes == null || themes.isEmpty()) {
            return null;
        }
        List<String> filtered = themes.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (filtered.isEmpty()) {
            return null;
        }
        return String.join(", ", filtered);
    }

    /**
     * Resolves a list of designer IDs and joins their names into a comma-separated string.
     *
     * @param designerIds List of IDs from the stamp metadata.
     * @param designerNames Map of preloaded names.
     * @return A joined string of names or null.
     */
    private String joinDesignerNames(List<String> designerIds, Map<String, String> designerNames) {
        if (designerIds == null || designerIds.isEmpty()) {
            return null;
        }
        List<String> names = designerIds.stream()
                .map(designerNames::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (names.isEmpty()) {
            return null;
        }
        return String.join(", ", names);
    }
}
