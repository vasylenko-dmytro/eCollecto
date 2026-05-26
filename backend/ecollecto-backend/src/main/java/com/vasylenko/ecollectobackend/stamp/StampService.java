package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.dto.StampDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Handles complex data orchestration for stamps, including bulk designer-name resolution,
 * before delegating the actual document-to-DTO conversion to {@link StampMapper}.
 */
@Service
@RequiredArgsConstructor
public class StampService {
    private final StampRepository stampRepository;
    private final com.vasylenko.ecollectobackend.designer.DesignerRepository designerRepository;
    private final StampMapper stampMapper;

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
                .map(document -> stampMapper.toDto(document, designerNames))
                .collect(Collectors.toList());
    }

    public Optional<StampDto> findById(String id) {
        return stampRepository.findById(id).map(document -> {
            Set<String> designerIds = Optional.ofNullable(document.getMeta())
                    .map(StampDocument.Meta::getDesignerIds)
                    .map(list -> list.stream().filter(Objects::nonNull).collect(Collectors.toSet()))
                    .orElse(Set.of());
            Map<String, String> designerNames = loadDesignerNames(designerIds);
            return stampMapper.toDto(document, designerNames);
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
