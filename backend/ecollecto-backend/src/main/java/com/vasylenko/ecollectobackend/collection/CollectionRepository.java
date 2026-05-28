package com.vasylenko.ecollectobackend.collection;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends MongoRepository<CollectionItemDocument, String> {

    List<CollectionItemDocument> findByUserId(String userId);

    Optional<CollectionItemDocument> findByUserIdAndStampId(String userId, String stampId);

    boolean existsByUserIdAndStampId(String userId, String stampId);
}

