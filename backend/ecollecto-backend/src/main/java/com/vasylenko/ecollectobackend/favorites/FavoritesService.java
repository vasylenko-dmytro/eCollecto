package com.vasylenko.ecollectobackend.favorites;

import com.vasylenko.ecollectobackend.common.exception.ConflictException;
import com.vasylenko.ecollectobackend.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoritesService {

    private final FavoritesRepository favoritesRepository;

    public List<FavoriteItemDto> getFavorites(String userId) {
        return favoritesRepository.findByUserId(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public FavoriteItemDto addItem(String userId, String stampId) {
        FavoriteDocument doc = new FavoriteDocument();
        doc.setUserId(userId);
        doc.setStampId(stampId);
        doc.setAddedAt(Instant.now());
        try {
            FavoriteDocument saved = favoritesRepository.save(doc);
            return toDto(saved);
        } catch (DuplicateKeyException e) {
            throw new ConflictException("Stamp '" + stampId + "' is already in your favorites.");
        }
    }

    public void removeItem(String userId, String stampId) {
        FavoriteDocument doc = favoritesRepository.findByUserIdAndStampId(userId, stampId)
                .orElseThrow(() -> new NotFoundException(
                        "Stamp '" + stampId + "' is not in your favorites."));
        favoritesRepository.delete(doc);
    }

    private FavoriteItemDto toDto(FavoriteDocument doc) {
        return FavoriteItemDto.builder()
                .stampId(doc.getStampId())
                .addedAt(doc.getAddedAt())
                .build();
    }
}

