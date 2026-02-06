package com.vasylenko.ecollectobackend.fdc;

import com.vasylenko.ecollectobackend.dto.FirstDayCoverDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * This service coordinates data between FDC records and Designer records to provide
 * fully populated Data Transfer Objects (DTOs).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FirstDayCoverService {
    private final FirstDayCoverRepository firstDayCoverRepository;
    private final com.vasylenko.ecollectobackend.designer.DesignerRepository designerRepository;

    /**
     * Retrieves all First Day Covers, including resolved designer names.
     * Performs a bulk lookup of designer names to optimize performance (avoiding N+1 queries).
     *
     * @return A list of {@link FirstDayCoverDto} objects with populated details.
     */
    public List<FirstDayCoverDto> findAll() {
        List<FirstDayCoverDocument> documents = firstDayCoverRepository.findAll();
        Map<String, String> designerNames = loadDesignerNames(
                documents.stream()
                        .map(FirstDayCoverDocument::getDesignerId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet())
        );

        return documents.stream()
                .map(document -> toDto(document, designerNames))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single First Day Cover by ID with its associated designer name.
     *
     * @param id The unique identifier of the FDC.
     * @return An {@link Optional} containing the {@link FirstDayCoverDto} if found.
     */
    public Optional<FirstDayCoverDto> findById(String id) {
        return firstDayCoverRepository.findById(id).map(document -> {
            Set<String> designerIds = document.getDesignerId() != null
                    ? Set.of(document.getDesignerId())
                    : Set.of();
            Map<String, String> designerNames = loadDesignerNames(designerIds);
            return toDto(document, designerNames);
        });
    }

    /**
     * Helper method to fetch designer names in bulk from the Designer collection.
     *
     * @param designerIds A collection of designer IDs to resolve.
     * @return A map where the key is the Designer ID and the value is the Designer Name.
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
     * Maps an internal FDC document and a map of resolved designer names to a public DTO.
     * Handles null-safety for nested objects like Postmark, Envelope, and Release.
     *
     * @param document The source {@link FirstDayCoverDocument}.
     * @param designerNames A map of pre-resolved designer names.
     * @return A fully constructed {@link FirstDayCoverDto}.
     */
    private FirstDayCoverDto toDto(FirstDayCoverDocument document, Map<String, String> designerNames) {
        FirstDayCoverDocument.Postmark postmark = document.getPostmark();
        FirstDayCoverDocument.Envelope envelope = document.getEnvelope();
        FirstDayCoverDocument.Release release = document.getRelease();

        return FirstDayCoverDto.builder()
                .postmarkId(postmark != null ? postmark.getId() : null)
                .envelopeId(envelope != null ? envelope.getId() : null)
                .name(document.getName())
                .description(document.getDescription())
                .postmarkSKU(postmark != null ? postmark.getSku() : null)
                .envelopeSKU(envelope != null ? envelope.getSku() : null)
                .designer(designerNames.getOrDefault(document.getDesignerId(), null))
                .release(FirstDayCoverDto.ReleaseDto.builder()
                        .year(release != null ? release.getYear() : null)
                        .date(release != null ? release.getDate() : null)
                        .printQuantity(release != null ? release.getPrintQuantity() : null)
                        .build())
                .images(FirstDayCoverDto.ImagesDto.builder()
                        .envelope(envelope != null ? envelope.getImage() : null)
                        .postmark(postmark != null ? postmark.getImage() : null)
                        .build())
                .build();
    }
}
