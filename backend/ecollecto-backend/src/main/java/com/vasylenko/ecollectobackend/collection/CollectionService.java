package com.vasylenko.ecollectobackend.collection;

import com.vasylenko.ecollectobackend.common.exception.ConflictException;
import com.vasylenko.ecollectobackend.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;

    public List<CollectionItemDto> getCollection(String userId) {
        return collectionRepository.findByUserId(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public CollectionItemDto addItem(String userId, String stampId) {
        CollectionItemDocument doc = new CollectionItemDocument();
        doc.setUserId(userId);
        doc.setStampId(stampId);
        doc.setAddedAt(Instant.now());
        try {
            CollectionItemDocument saved = collectionRepository.save(doc);
            return toDto(saved);
        } catch (DuplicateKeyException e) {
            throw new ConflictException("Stamp '" + stampId + "' is already in your collection.");
        }
    }

    public void removeItem(String userId, String stampId) {
        CollectionItemDocument doc = collectionRepository.findByUserIdAndStampId(userId, stampId)
                .orElseThrow(() -> new NotFoundException(
                        "Stamp '" + stampId + "' is not in your collection."));
        collectionRepository.delete(doc);
    }

    private CollectionItemDto toDto(CollectionItemDocument doc) {
        return CollectionItemDto.builder()
                .stampId(doc.getStampId())
                .addedAt(doc.getAddedAt())
                .build();
    }
}

