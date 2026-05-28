package com.vasylenko.ecollectobackend.wishlist;

import com.vasylenko.ecollectobackend.common.exception.ConflictException;
import com.vasylenko.ecollectobackend.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    public List<WishlistItemDto> getWishlist(String userId) {
        return wishlistRepository.findByUserId(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public WishlistItemDto addItem(String userId, String stampId) {
        WishlistItemDocument doc = new WishlistItemDocument();
        doc.setUserId(userId);
        doc.setStampId(stampId);
        doc.setAddedAt(Instant.now());
        try {
            WishlistItemDocument saved = wishlistRepository.save(doc);
            return toDto(saved);
        } catch (DuplicateKeyException e) {
            throw new ConflictException("Stamp '" + stampId + "' is already on your wishlist.");
        }
    }

    public void removeItem(String userId, String stampId) {
        WishlistItemDocument doc = wishlistRepository.findByUserIdAndStampId(userId, stampId)
                .orElseThrow(() -> new NotFoundException(
                        "Stamp '" + stampId + "' is not on your wishlist."));
        wishlistRepository.delete(doc);
    }

    private WishlistItemDto toDto(WishlistItemDocument doc) {
        return WishlistItemDto.builder()
                .stampId(doc.getStampId())
                .addedAt(doc.getAddedAt())
                .build();
    }
}

