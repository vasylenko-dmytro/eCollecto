package com.vasylenko.ecollectobackend.designer;

import com.vasylenko.ecollectobackend.dto.DesignerDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Handles the retrieval of designer data and converts internal {@link DesignerDocument}
 * entities into {@link DesignerDto} objects for API consumption.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DesignerService {
    private final DesignerRepository designerRepository;

    /**
     * Retrieves all designers from the database.
     *
     * @return a {@link List} of {@link DesignerDto} containing all found designers.
     */
    public List<DesignerDto> findAll() {
        return designerRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Finds a specific designer by their unique identifier.
     *
     * @param id the unique ID of the designer.
     * @return an {@link Optional} containing the {@link DesignerDto} if found.
     */
    public Optional<DesignerDto> findById(String id) {
        Optional<DesignerDto> designer = designerRepository.findById(id).map(this::toDto);
        if (designer.isEmpty()) {
            log.warn("Designer with id {} not found", id);
        }
        return designer;
    }

    /**
     * Converts a database document entity to a Data Transfer Object (DTO).
     *
     * @param document the {@link DesignerDocument} to convert.
     * @return a populated {@link DesignerDto}.
     */
    private DesignerDto toDto(DesignerDocument document) {
        return DesignerDto.builder()
                .designerId(document.getId())
                .name(document.getName())
                .build();
    }
}
