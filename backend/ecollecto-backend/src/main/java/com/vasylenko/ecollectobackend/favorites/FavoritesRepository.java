package com.vasylenko.ecollectobackend.favorites;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoritesRepository extends MongoRepository<FavoriteDocument, String> {

    List<FavoriteDocument> findByUserId(String userId);

    Optional<FavoriteDocument> findByUserIdAndStampId(String userId, String stampId);

    boolean existsByUserIdAndStampId(String userId, String stampId);
}

