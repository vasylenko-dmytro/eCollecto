package com.vasylenko.ecollectobackend.wishlist;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends MongoRepository<WishlistItemDocument, String> {

    List<WishlistItemDocument> findByUserId(String userId);

    Optional<WishlistItemDocument> findByUserIdAndStampId(String userId, String stampId);

    boolean existsByUserIdAndStampId(String userId, String stampId);
}

