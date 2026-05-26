package com.vasylenko.ecollectobackend.fdc;

import com.vasylenko.ecollectobackend.dto.FirstDayCoverDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Orchestrates FDC retrieval with bulk designer-name resolution,
 * delegating document-to-DTO conversion to {@link FirstDayCoverMapper}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FirstDayCoverService {
    private final FirstDayCoverRepository firstDayCoverRepository;
    private final com.vasylenko.ecollectobackend.designer.DesignerRepository designerRepository;
    private final FirstDayCoverMapper firstDayCoverMapper;

    public List<FirstDayCoverDto> findAll() {
        List<FirstDayCoverDocument> documents = firstDayCoverRepository.findAll();
        Map<String, String> designerNames = loadDesignerNames(
                documents.stream()
                        .map(FirstDayCoverDocument::getDesignerId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet())
        );

        return documents.stream()
                .map(document -> firstDayCoverMapper.toDto(document, designerNames))
                .collect(Collectors.toList());
    }

    public Optional<FirstDayCoverDto> findById(String id) {
        return firstDayCoverRepository.findById(id).map(document -> {
            Set<String> designerIds = document.getDesignerId() != null
                    ? Set.of(document.getDesignerId())
                    : Set.of();
            Map<String, String> designerNames = loadDesignerNames(designerIds);
            return firstDayCoverMapper.toDto(document, designerNames);
        });
    }

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
}
